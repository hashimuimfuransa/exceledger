const { JournalEntry, JournalLine, Account, Ledger, AccountingPeriod, AuditTrail } = require('../models');
const mongoose = require('mongoose');

// Helper function to calculate account balance at a specific date
const calculateAccountBalance = async (accountId, asOfDate) => {
  const lastLedgerEntry = await Ledger.findOne({
    account: accountId,
    entryDate: { $lte: asOfDate }
  }).sort({ entryDate: -1 });
  
  return lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;
};

// Helper function to get period transactions for an account
const getPeriodTransactions = async (accountId, startDate, endDate) => {
  return await Ledger.find({
    account: accountId,
    entryDate: { $gte: startDate, $lte: endDate }
  }).sort({ entryDate: 1 });
};

// Helper function to calculate accrued amounts
const calculateAccruedAmount = async (accountId, startDate, endDate, accrualType) => {
  const transactions = await getPeriodTransactions(accountId, startDate, endDate);
  
  if (accrualType === 'revenue') {
    return transactions.reduce((sum, tx) => sum + tx.creditAmount, 0);
  } else if (accrualType === 'expense') {
    return transactions.reduce((sum, tx) => sum + tx.debitAmount, 0);
  }
  
  return 0;
};

// Helper function to calculate prepaid amounts
const calculatePrepaidAmount = async (accountId, startDate, endDate, totalAmount) => {
  const daysInPeriod = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const totalDays = 365; // Assuming annual period
  const periodFraction = daysInPeriod / totalDays;
  
  return totalAmount * periodFraction;
};

const createAdjustedEntry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      description, 
      lines, 
      adjustmentDate, 
      adjustmentType, 
      referenceTransactions, 
      autoCalculate,
      autoReverse,
      reverseDate,
      reportingPeriod
    } = req.body;

    if (!description || !lines || lines.length === 0) {
      return res.status(400).json({ 
        message: 'Description and journal lines are required' 
      });
    }

    // Validate reporting period
    const targetDate = adjustmentDate ? new Date(adjustmentDate) : new Date();
    const period = reportingPeriod || `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Check if period is open for adjustments
    const accountingPeriod = await AccountingPeriod.findOne({ period });
    if (accountingPeriod && accountingPeriod.status !== 'open') {
      return res.status(400).json({
        message: `Period ${period} is ${accountingPeriod.status}. Cannot create adjusting entries.`
      });
    }

    // Get or create the period
    const periodDoc = await AccountingPeriod.getOrCreatePeriod(targetDate);

    let processedLines = [...lines];
    
    // Auto-calculate adjustment amounts if requested
    if (autoCalculate && adjustmentType) {
      processedLines = await calculateAdjustmentAmounts(processedLines, adjustmentType, adjustmentDate, referenceTransactions);
    }

    // Validate that entry is balanced
    console.log('Backend Balance Validation Debug:');
    console.log('Processed lines:', processedLines);
    
    const totalDebit = processedLines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
    const totalCredit = processedLines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
    
    console.log('Backend Total Debit:', totalDebit);
    console.log('Backend Total Credit:', totalCredit);
    console.log('Backend Difference:', Math.abs(totalDebit - totalCredit));
    
    console.log('Line details:', processedLines.map((line, i) => ({
      line: i + 1,
      debit: parseFloat(line.debitAmount) || 0,
      credit: parseFloat(line.creditAmount) || 0,
      debitStr: line.debitAmount,
      creditStr: line.creditAmount,
      debitType: typeof line.debitAmount,
      creditType: typeof line.creditAmount
    })));

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ 
        message: `Journal entry must be balanced (total debits = total credits). Backend: Debits=${totalDebit}, Credits=${totalCredit}` 
      });
    }

    // Generate adjusted entry number
    const entryDate = adjustmentDate ? new Date(adjustmentDate) : new Date();
    const year = entryDate.getFullYear();
    const prefix = `ADJ${year}`;
    const lastEntry = await JournalEntry.findOne({ 
      entryNumber: new RegExp(`^${prefix}`) 
    }).sort({ entryNumber: -1 }).session(session);
    
    let sequence = 1;
    if (lastEntry) {
      const lastSequence = parseInt(lastEntry.entryNumber.slice(prefix.length));
      sequence = lastSequence + 1;
    }
    
    const entryNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;

    // Create journal entry with enhanced fields
    const journalEntry = new JournalEntry({
      entryNumber,
      entryDate: entryDate,
      description,
      totalDebit,
      totalCredit,
      entryType: 'adjusting',
      status: 'draft',
      createdBy: req.user.id,
      referenceNumber: referenceTransactions ? referenceTransactions.join(',') : null,
      adjustmentType,
      autoCalculated: autoCalculate || false,
      reportingPeriod: period,
      periodStartDate: periodDoc.startDate,
      periodEndDate: periodDoc.endDate,
      autoReverse: autoReverse || false,
      reverseDate: reverseDate || null
    });

    await journalEntry.save({ session });

    // Create journal lines
    for (const line of processedLines) {
      const account = await Account.findById(line.accountId).session(session);
      if (!account) {
        throw new Error(`Account not found: ${line.accountId}`);
      }

      const journalLine = new JournalLine({
        journalEntry: journalEntry._id,
        account: account._id,
        debitAmount: line.debitAmount || 0,
        creditAmount: line.creditAmount || 0,
        description: line.description || description,
        referenceTransaction: line.referenceTransaction || null,
        adjustmentDetails: line.adjustmentDetails || {}
      });

      await journalLine.save({ session });
      journalEntry.lines.push(journalLine._id);
    }

    await journalEntry.save({ session });

    // Create audit trail entry
    await AuditTrail.trackJournalEntry(journalEntry, 'create', req.user, []);

    await session.commitTransaction();

    const populatedEntry = await JournalEntry.findById(journalEntry._id)
      .populate('lines')
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email');

    res.status(201).json({
      message: 'Adjusted journal entry created successfully',
      entry: populatedEntry,
      autoCalculated: autoCalculate || false
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Create adjusted entry error:', error);
    res.status(500).json({ 
      message: 'Server error creating adjusted entry',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

const approveAdjustedEntry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { entryId } = req.params;
    const { notes } = req.body;

    const journalEntry = await JournalEntry.findById(entryId).session(session);
    if (!journalEntry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    if (journalEntry.entryType !== 'adjusting') {
      return res.status(400).json({ message: 'Only adjusting entries can be approved' });
    }

    if (journalEntry.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft entries can be approved' });
    }

    // Check if period is still open
    const accountingPeriod = await AccountingPeriod.findOne({ 
      period: journalEntry.reportingPeriod 
    });
    
    if (accountingPeriod && accountingPeriod.status !== 'open') {
      return res.status(400).json({
        message: `Period ${journalEntry.reportingPeriod} is ${accountingPeriod.status}. Cannot approve entry.`
      });
    }

    // Update entry with approval
    journalEntry.status = 'posted';
    journalEntry.approvedBy = req.user.id;
    journalEntry.approvedAt = new Date();
    journalEntry.postedAt = new Date();

    await journalEntry.save({ session });

    // Create journal lines and update ledger
    const lines = await JournalLine.find({ journalEntry: journalEntry._id }).session(session);
    for (const line of lines) {
      const account = await Account.findById(line.account).session(session);
      await updateLedger(account, line, journalEntry.entryDate, session, {
        isAdjustment: true,
        adjustmentType: journalEntry.adjustmentType,
        referenceTransaction: line.referenceTransaction
      });
    }

    // Update period statistics
    if (accountingPeriod) {
      accountingPeriod.adjustingEntriesCount += 1;
      await accountingPeriod.save({ session });
    }

    // Create audit trail
    await AuditTrail.trackJournalEntry(journalEntry, 'approve', req.user, []);
    await AuditTrail.trackApproval(journalEntry, req.user, true);

    await session.commitTransaction();

    const populatedEntry = await JournalEntry.findById(journalEntry._id)
      .populate('lines')
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email');

    res.json({
      message: 'Adjusting entry approved and posted successfully',
      entry: populatedEntry
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Approve adjusted entry error:', error);
    res.status(500).json({ 
      message: 'Server error approving adjusted entry',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

const postAdjustedEntry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { entryId } = req.params;

    const journalEntry = await JournalEntry.findById(entryId).session(session);
    if (!journalEntry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    if (journalEntry.entryType !== 'adjusting') {
      return res.status(400).json({ message: 'Only adjusting entries can be posted' });
    }

    if (journalEntry.status !== 'posted') {
      return res.status(400).json({ message: 'Entry must be approved before posting' });
    }

    // Create audit trail
    await AuditTrail.trackJournalEntry(journalEntry, 'post', req.user, []);

    await session.commitTransaction();

    res.json({
      message: 'Adjusting entry posted successfully',
      entry: journalEntry
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Post adjusted entry error:', error);
    res.status(500).json({ 
      message: 'Server error posting adjusted entry',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

const getAdjustingEntries = async (req, res) => {
  try {
    console.log('Query parameters received:', req.query);
    
    const { 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50, 
      status, 
      adjustmentType,
      reportingPeriod 
    } = req.query;

    const filter = { entryType: 'adjusting' };
    
    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) {
        console.log('Processing startDate:', startDate);
        const startDateObj = new Date(startDate);
        console.log('startDateObj:', startDateObj);
        console.log('isNaN check:', isNaN(startDateObj.getTime()));
        // Temporarily bypass validation to test
        if (!isNaN(startDateObj.getTime())) {
          filter.entryDate.$gte = startDateObj;
        }
      }
      if (endDate) {
        console.log('Processing endDate:', endDate);
        const endDateObj = new Date(endDate);
        console.log('endDateObj:', endDateObj);
        console.log('isNaN check:', isNaN(endDateObj.getTime()));
        // Temporarily bypass validation to test
        if (!isNaN(endDateObj.getTime())) {
          filter.entryDate.$lte = endDateObj;
        }
      }
    }
    
    if (status) filter.status = status;
    if (adjustmentType) filter.adjustmentType = adjustmentType;
    if (reportingPeriod) filter.reportingPeriod = reportingPeriod;

    const skip = (page - 1) * limit;

    const adjustedEntries = await JournalEntry.find(filter)
      .populate('lines')
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email')
      .sort({ entryDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JournalEntry.countDocuments(filter);

    res.json({
      adjustedEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get adjusting entries error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      message: 'Server error fetching adjusting entries',
      error: error.message 
    });
  }
};

const performYearEndClosing = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { closingDate, fiscalYear } = req.body;

    if (!closingDate || !fiscalYear) {
      return res.status(400).json({ 
        message: 'Closing date and fiscal year are required' 
      });
    }

    const closingDateObj = new Date(closingDate);
    const yearStart = new Date(fiscalYear, 0, 1);
    const yearEnd = new Date(fiscalYear, 11, 31);

    // Get revenue and expense accounts
    const revenueAccounts = await Account.find({ 
      accountType: 'revenue', 
      isActive: true 
    });

    const expenseAccounts = await Account.find({ 
      accountType: 'expense', 
      isActive: true 
    });

    // Get retained earnings account
    const retainedEarningsAccount = await Account.findOne({ 
      accountType: 'equity',
      subType: 'retained_earnings',
      isActive: true 
    });

    if (!retainedEarningsAccount) {
      return res.status(400).json({ 
        message: 'Retained earnings account not found' 
      });
    }

    // Calculate total revenue and expenses for the year
    let totalRevenue = 0;
    let totalExpenses = 0;

    // Calculate revenue
    for (const account of revenueAccounts) {
      const revenueAmount = await Ledger.aggregate([
        {
          $match: {
            account: account._id,
            entryDate: { $gte: yearStart, $lte: yearEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$creditAmount' }
          }
        }
      ]);

      const amount = revenueAmount.length > 0 ? revenueAmount[0].total : 0;
      totalRevenue += amount;
    }

    // Calculate expenses
    for (const account of expenseAccounts) {
      const expenseAmount = await Ledger.aggregate([
        {
          $match: {
            account: account._id,
            entryDate: { $gte: yearStart, $lte: yearEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$debitAmount' }
          }
        }
      ]);

      const amount = expenseAmount.length > 0 ? expenseAmount[0].total : 0;
      totalExpenses += amount;
    }

    const netIncome = totalRevenue - totalExpenses;

    // Generate closing entry number
    const prefix = `CLOSE${fiscalYear}`;
    const lastEntry = await JournalEntry.findOne({ 
      entryNumber: new RegExp(`^${prefix}`) 
    }).sort({ entryNumber: -1 });
    
    let sequence = 1;
    if (lastEntry) {
      const lastSequence = parseInt(lastEntry.entryNumber.slice(prefix.length));
      sequence = lastSequence + 1;
    }
    
    const entryNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;

    // Create closing entry
    const closingEntry = new JournalEntry({
      entryNumber,
      entryDate: closingDateObj,
      description: `Year-end closing for fiscal year ${fiscalYear}`,
      totalDebit: Math.max(totalRevenue, totalExpenses),
      totalCredit: Math.max(totalRevenue, totalExpenses),
      entryType: 'closing',
      status: 'posted',
      postedAt: new Date(),
      createdBy: req.user.id
    });

    await closingEntry.save({ session });

    const closingLines = [];

    // Close revenue accounts (debit revenue, credit retained earnings)
    for (const account of revenueAccounts) {
      const revenueAmount = await Ledger.aggregate([
        {
          $match: {
            account: account._id,
            entryDate: { $gte: yearStart, $lte: yearEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$creditAmount' }
          }
        }
      ]);

      const amount = revenueAmount.length > 0 ? revenueAmount[0].total : 0;
      if (amount > 0) {
        // Debit revenue account to zero it out
        const revenueLine = new JournalLine({
          journalEntry: closingEntry._id,
          account: account._id,
          debitAmount: amount,
          creditAmount: 0,
          description: `Close revenue account - ${fiscalYear}`
        });

        await revenueLine.save({ session });
        closingLines.push(revenueLine._id);
        await updateLedger(account, revenueLine, closingDateObj, session);

        // Credit retained earnings
        const retainedLine = new JournalLine({
          journalEntry: closingEntry._id,
          account: retainedEarningsAccount._id,
          debitAmount: 0,
          creditAmount: amount,
          description: `Transfer revenue to retained earnings - ${fiscalYear}`
        });

        await retainedLine.save({ session });
        closingLines.push(retainedLine._id);
        await updateLedger(retainedEarningsAccount, retainedLine, closingDateObj, session);
      }
    }

    // Close expense accounts (credit expense, debit retained earnings)
    for (const account of expenseAccounts) {
      const expenseAmount = await Ledger.aggregate([
        {
          $match: {
            account: account._id,
            entryDate: { $gte: yearStart, $lte: yearEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$debitAmount' }
          }
        }
      ]);

      const amount = expenseAmount.length > 0 ? expenseAmount[0].total : 0;
      if (amount > 0) {
        // Credit expense account to zero it out
        const expenseLine = new JournalLine({
          journalEntry: closingEntry._id,
          account: account._id,
          debitAmount: 0,
          creditAmount: amount,
          description: `Close expense account - ${fiscalYear}`
        });

        await expenseLine.save({ session });
        closingLines.push(expenseLine._id);
        await updateLedger(account, expenseLine, closingDateObj, session);

        // Debit retained earnings
        const retainedLine = new JournalLine({
          journalEntry: closingEntry._id,
          account: retainedEarningsAccount._id,
          debitAmount: amount,
          creditAmount: 0,
          description: `Transfer expenses to retained earnings - ${fiscalYear}`
        });

        await retainedLine.save({ session });
        closingLines.push(retainedLine._id);
        await updateLedger(retainedEarningsAccount, retainedLine, closingDateObj, session);
      }
    }

    closingEntry.lines = closingLines;
    await closingEntry.save({ session });

    await session.commitTransaction();

    const populatedEntry = await JournalEntry.findById(closingEntry._id)
      .populate('lines')
      .populate('createdBy', 'username email');

    res.json({
      message: 'Year-end closing completed successfully',
      closingEntry: populatedEntry,
      summary: {
        fiscalYear,
        totalRevenue,
        totalExpenses,
        netIncome,
        closingDate: closingDateObj
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Year-end closing error:', error);
    res.status(500).json({ 
      message: 'Server error during year-end closing',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

const getClosingEntries = async (req, res) => {
  try {
    const { fiscalYear, page = 1, limit = 50 } = req.query;

    const filter = { entryType: 'closing' };
    if (fiscalYear) {
      const yearStart = new Date(fiscalYear, 0, 1);
      const yearEnd = new Date(fiscalYear, 11, 31);
      filter.entryDate = { $gte: yearStart, $lte: yearEnd };
    }

    const skip = (page - 1) * limit;

    const closingEntries = await JournalEntry.find(filter)
      .populate('lines')
      .populate('createdBy', 'username email')
      .sort({ entryDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JournalEntry.countDocuments(filter);

    res.json({
      closingEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get closing entries error:', error);
    res.status(500).json({ message: 'Server error fetching closing entries' });
  }
};

const openNewYear = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { newFiscalYear, openingDate } = req.body;

    if (!newFiscalYear || !openingDate) {
      return res.status(400).json({ 
        message: 'New fiscal year and opening date are required' 
      });
    }

    const openingDateObj = new Date(openingDate);
    const yearStart = new Date(newFiscalYear, 0, 1);

    // Get all balance sheet accounts (assets, liabilities, equity)
    const balanceSheetAccounts = await Account.find({ 
      accountType: { $in: ['asset', 'liability', 'equity'] },
      isActive: true 
    });

    // Generate opening entry number
    const prefix = `OPEN${newFiscalYear}`;
    const lastEntry = await JournalEntry.findOne({ 
      entryNumber: new RegExp(`^${prefix}`) 
    }).sort({ entryNumber: -1 });
    
    let sequence = 1;
    if (lastEntry) {
      const lastSequence = parseInt(lastEntry.entryNumber.slice(prefix.length));
      sequence = lastSequence + 1;
    }
    
    const entryNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;

    // Create opening entry
    const openingEntry = new JournalEntry({
      entryNumber,
      entryDate: openingDateObj,
      description: `Opening balances for fiscal year ${newFiscalYear}`,
      totalDebit: 0,
      totalCredit: 0,
      entryType: 'regular',
      status: 'posted',
      postedAt: new Date(),
      createdBy: req.user.id
    });

    await openingEntry.save({ session });

    const openingLines = [];
    let totalDebit = 0;
    let totalCredit = 0;

    // Get closing balances from previous year
    for (const account of balanceSheetAccounts) {
      const lastLedgerEntry = await Ledger.findOne({ 
        account: account._id,
        entryDate: { $lt: yearStart }
      }).sort({ entryDate: -1 });

      const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;

      if (balance !== 0) {
        const journalLine = new JournalLine({
          journalEntry: openingEntry._id,
          account: account._id,
          debitAmount: account.normalBalance === 'debit' ? Math.abs(balance) : 0,
          creditAmount: account.normalBalance === 'credit' ? Math.abs(balance) : 0,
          description: `Opening balance for ${newFiscalYear}`
        });

        await journalLine.save({ session });
        openingLines.push(journalLine._id);

        if (account.normalBalance === 'debit') {
          totalDebit += Math.abs(balance);
        } else {
          totalCredit += Math.abs(balance);
        }

        await updateLedger(account, journalLine, openingDateObj, session);
      }
    }

    // Update totals
    openingEntry.totalDebit = totalDebit;
    openingEntry.totalCredit = totalCredit;
    openingEntry.lines = openingLines;
    await openingEntry.save({ session });

    await session.commitTransaction();

    const populatedEntry = await JournalEntry.findById(openingEntry._id)
      .populate('lines')
      .populate('createdBy', 'username email');

    res.json({
      message: 'New year opened successfully',
      openingEntry: populatedEntry,
      summary: {
        fiscalYear: newFiscalYear,
        openingDate: openingDateObj,
        totalDebit,
        totalCredit,
        accountsOpened: openingLines.length
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Open new year error:', error);
    res.status(500).json({ 
      message: 'Server error opening new year',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

// Helper function to update ledger with enhanced tracking
const updateLedger = async (account, journalLine, entryDate, session = null, metadata = {}) => {
  try {
    // Get last balance for this account
    const lastLedgerEntry = await Ledger.findOne({ 
      account: account._id,
      entryDate: { $lt: entryDate }
    }).sort({ entryDate: -1 }).session(session);

    let runningBalance = 0;
    if (lastLedgerEntry) {
      runningBalance = lastLedgerEntry.runningBalance;
    }

    // Calculate new balance
    if (account.normalBalance === 'debit') {
      runningBalance += journalLine.debitAmount - journalLine.creditAmount;
    } else {
      runningBalance += journalLine.creditAmount - journalLine.debitAmount;
    }

    // Create ledger entry with enhanced tracking
    const ledgerEntry = new Ledger({
      account: account._id,
      journalEntry: journalLine.journalEntry,
      journalLine: journalLine._id,
      entryDate,
      debitAmount: journalLine.debitAmount,
      creditAmount: journalLine.creditAmount,
      balance: journalLine.debitAmount - journalLine.creditAmount,
      runningBalance,
      description: journalLine.description,
      isAdjustment: metadata.isAdjustment || false,
      adjustmentType: metadata.adjustmentType || null,
      referenceTransaction: metadata.referenceTransaction || null
    });

    await ledgerEntry.save({ session });

  } catch (error) {
    console.error('Update ledger error:', error);
    throw error;
  }
};

// Helper function to calculate adjustment amounts based on type
const calculateAdjustmentAmounts = async (lines, adjustmentType, adjustmentDate, referenceTransactions) => {
  const processedLines = [];
  
  for (const line of lines) {
    const processedLine = { ...line };
    
    switch (adjustmentType) {
      case 'accrual':
        // Calculate accrued revenue or expenses
        if (line.accrualPeriod && line.accrualRate) {
          const startDate = new Date(adjustmentDate);
          startDate.setMonth(startDate.getMonth() - (line.accrualPeriod || 1));
          
          const accruedAmount = await calculateAccruedAmount(
            line.accountId, 
            startDate, 
            new Date(adjustmentDate), 
            line.accrualType
          );
          
          if (line.accrualType === 'revenue') {
            processedLine.creditAmount = accruedAmount * (line.accrualRate / 100);
          } else {
            processedLine.debitAmount = accruedAmount * (line.accrualRate / 100);
          }
        }
        break;
        
      case 'deferral':
        // Calculate prepaid expenses or unearned revenue
        if (line.deferralPeriod && line.totalAmount) {
          const startDate = new Date(adjustmentDate);
          startDate.setMonth(startDate.getMonth() - (line.deferralPeriod || 1));
          
          const deferredAmount = await calculatePrepaidAmount(
            line.accountId,
            startDate,
            new Date(adjustmentDate),
            line.totalAmount
          );
          
          if (line.deferralType === 'expense') {
            processedLine.debitAmount = deferredAmount;
          } else {
            processedLine.creditAmount = deferredAmount;
          }
        }
        break;
        
      case 'correcting':
        // Calculate correction based on existing transactions
        if (line.correctingAmount) {
          if (line.correctingDirection === 'debit') {
            processedLine.debitAmount = line.correctingAmount;
          } else {
            processedLine.creditAmount = line.correctingAmount;
          }
        }
        break;
        
      case 'year_end':
        // Calculate year-end adjustments based on account balances
        const currentBalance = await calculateAccountBalance(line.accountId, adjustmentDate);
        if (line.adjustmentMethod === 'zero_balance') {
          // Zero out temporary accounts
          if (currentBalance > 0) {
            processedLine.debitAmount = currentBalance;
          } else {
            processedLine.creditAmount = Math.abs(currentBalance);
          }
        }
        break;
    }
    
    processedLines.push(processedLine);
  }
  
  return processedLines;
};

// Helper function to create reversing entry
const createReversingEntryHelper = async (originalEntryId, reversalDate, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const originalEntry = await JournalEntry.findById(originalEntryId)
      .populate('lines')
      .session(session);
    
    if (!originalEntry || originalEntry.entryType !== 'adjusted') {
      throw new Error('Original entry not found or not an adjusted entry');
    }
    
    // Generate reversing entry number
    const year = new Date(reversalDate).getFullYear();
    const prefix = `REV${year}`;
    const lastEntry = await JournalEntry.findOne({ 
      entryNumber: new RegExp(`^${prefix}`) 
    }).sort({ entryNumber: -1 }).session(session);
    
    let sequence = 1;
    if (lastEntry) {
      const lastSequence = parseInt(lastEntry.entryNumber.slice(prefix.length));
      sequence = lastSequence + 1;
    }
    
    const entryNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;
    
    // Create reversing entry
    const reversingEntry = new JournalEntry({
      entryNumber,
      entryDate: reversalDate,
      description: `Reversing entry for ${originalEntry.entryNumber}`,
      totalDebit: originalEntry.totalCredit,
      totalCredit: originalEntry.totalDebit,
      entryType: 'adjusted',
      status: 'posted',
      postedAt: new Date(),
      createdBy: req.user.id,
      referenceNumber: originalEntry.entryNumber,
      adjustmentType: 'reversal',
      reversesEntry: originalEntry._id
    });
    
    await reversingEntry.save({ session });
    
    // Create reversing lines (swap debits and credits)
    for (const originalLine of originalEntry.lines) {
      const reversingLine = new JournalLine({
        journalEntry: reversingEntry._id,
        account: originalLine.account,
        debitAmount: originalLine.creditAmount,
        creditAmount: originalLine.debitAmount,
        description: `Reversal: ${originalLine.description}`,
        referenceTransaction: originalLine._id
      });
      
      await reversingLine.save({ session });
      reversingEntry.lines.push(reversingLine._id);
      
      const account = await Account.findById(originalLine.account).session(session);
      await updateLedger(account, reversingLine, reversalDate, session, {
        isAdjustment: true,
        adjustmentType: 'reversal',
        referenceTransaction: originalLine._id
      });
    }
    
    await reversingEntry.save({ session });
    
    // Mark original entry as reversed
    originalEntry.reversedBy = reversingEntry._id;
    await originalEntry.save({ session });
    
    await session.commitTransaction();
    
    return reversingEntry;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const createReversingEntry = async (req, res) => {
  try {
    const { originalEntryId, reversalDate } = req.body;
    
    if (!originalEntryId || !reversalDate) {
      return res.status(400).json({
        message: 'Original entry ID and reversal date are required'
      });
    }
    
    const reversingEntry = await createReversingEntryHelper(originalEntryId, reversalDate, req);
    
    const populatedEntry = await JournalEntry.findById(reversingEntry._id)
      .populate('lines')
      .populate('createdBy', 'username email');
    
    res.status(201).json({
      message: 'Reversing entry created successfully',
      entry: populatedEntry
    });
  } catch (error) {
    console.error('Create reversing entry error:', error);
    res.status(500).json({
      message: 'Server error creating reversing entry',
      error: error.message
    });
  }
};

// Helper function to create automatic reversing entries
const createAutoReversingEntries = async (nextPeriodStartDate, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find all adjusting entries marked for auto-reverse
    const entriesToReverse = await JournalEntry.find({
      entryType: 'adjusting',
      status: 'posted',
      autoReverse: true,
      reversed: false,
      reverseDate: { $lte: nextPeriodStartDate }
    }).session(session);
    
    const reversingEntries = [];
    
    for (const entry of entriesToReverse) {
      const reversingEntry = await createReversingEntryHelper(entry._id, nextPeriodStartDate, { id: userId });
      
      // Mark original entry as reversed
      entry.reversed = true;
      entry.reversedBy = reversingEntry._id;
      await entry.save({ session });
      
      reversingEntries.push(reversingEntry);
    }
    
    await session.commitTransaction();
    return reversingEntries;
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Period-end workflow functions
const getPeriodEndWorkflow = async (req, res) => {
  try {
    const { reportingPeriod } = req.query;
    
    if (!reportingPeriod) {
      return res.status(400).json({ message: 'Reporting period is required' });
    }
    
    // Get period information
    const period = await AccountingPeriod.findOne({ period: reportingPeriod })
      .populate('closedBy', 'username email');
    
    if (!period) {
      return res.status(404).json({ message: 'Period not found' });
    }
    
    // Get trial balance for the period
    const trialBalance = await generateTrialBalanceForPeriod(reportingPeriod);
    
    // Get potential adjustment accounts
    const adjustmentAccounts = await Account.find({
      $or: [
        { accountName: /prepaid/i, accountType: 'asset' },
        { accountName: /accrued/i, accountType: 'liability' },
        { accountName: /depreciation/i, accountType: 'expense' },
        { accountName: /inventory/i, accountType: 'asset' }
      ]
    }).sort({ accountCode: 1 });
    
    // Get existing adjusting entries for the period
    const adjustingEntries = await JournalEntry.find({
      entryType: 'adjusting',
      reportingPeriod
    })
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email')
      .sort({ entryDate: -1 });
    
    res.json({
      period,
      trialBalance,
      adjustmentAccounts,
      adjustingEntries,
      workflow: {
        step1: 'Trial balance generated',
        step2: 'Review accounts for adjustments',
        step3: 'Create adjusting entries',
        step4: 'Post adjustments',
        step5: 'Generate updated reports'
      }
    });
    
  } catch (error) {
    console.error('Get period-end workflow error:', error);
    res.status(500).json({ message: 'Server error getting period-end workflow' });
  }
};

// Helper function to generate trial balance for a period
const generateTrialBalanceForPeriod = async (reportingPeriod) => {
  const period = await AccountingPeriod.findOne({ period: reportingPeriod });
  if (!period) throw new Error('Period not found');
  
  const accounts = await Account.find({ isActive: true }).sort({ accountCode: 1 });
  const trialBalance = [];
  
  for (const account of accounts) {
    const lastLedgerEntry = await Ledger.findOne({
      account: account._id,
      entryDate: { $lte: period.endDate }
    }).sort({ entryDate: -1 });
    
    const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;
    
    if (balance !== 0) {
      trialBalance.push({
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        normalBalance: account.normalBalance,
        balance,
        debitBalance: account.normalBalance === 'debit' ? Math.abs(balance) : 0,
        creditBalance: account.normalBalance === 'credit' ? Math.abs(balance) : 0
      });
    }
  }
  
  return trialBalance;
};

// Close accounting period
const closeAccountingPeriod = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { period, closingDate } = req.body;
    
    if (!period || !closingDate) {
      return res.status(400).json({ message: 'Period and closing date are required' });
    }
    
    // Close the period
    const closedPeriod = await AccountingPeriod.closePeriod(period, req.user.id, { session });
    
    // Create year-end closing if it's December
    if (period.endsWith('-12')) {
      const fiscalYear = parseInt(period.split('-')[0]);
      await performYearEndClosingHelper(fiscalYear, closingDate, req.user.id, session);
    }
    
    // Create auto-reversing entries for next period
    const nextPeriodStart = new Date(closedPeriod.endDate);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
    await createAutoReversingEntries(nextPeriodStart, req.user.id);
    
    await session.commitTransaction();
    
    res.json({
      message: `Period ${period} closed successfully`,
      period: closedPeriod,
      nextPeriodStart
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Close accounting period error:', error);
    res.status(500).json({ message: 'Server error closing accounting period' });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createAdjustedEntry,
  getAdjustingEntries,
  approveAdjustedEntry,
  postAdjustedEntry,
  performYearEndClosing,
  getClosingEntries,
  openNewYear,
  createReversingEntry,
  getPeriodEndWorkflow,
  closeAccountingPeriod,
  createAutoReversingEntries
};
