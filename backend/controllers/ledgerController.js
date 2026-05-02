const { Ledger, JournalEntry, JournalLine, Account } = require('../models');

const postToLedger = async (journalEntry) => {
  const session = await Ledger.startSession();
  session.startTransaction();

  try {
    // Fetch the journal entry with all lines
    const entry = await JournalEntry.findById(journalEntry._id)
      .populate('lines')
      .populate({
        path: 'lines',
        populate: { path: 'account', select: 'accountCode accountName normalBalance' }
      })
      .session(session);

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status !== 'posted') {
      throw new Error('Can only post posted journal entries to ledger');
    }

    // Check if already posted to ledger
    const existingLedgerEntries = await Ledger.find({ 
      journalEntry: entry._id 
    }).session(session);

    if (existingLedgerEntries.length > 0) {
      throw new Error('Journal entry already posted to ledger');
    }

    // Process each journal line
    for (const line of entry.lines) {
      const account = line.account;
      
      // Get previous running balance for this account
      const lastLedgerEntry = await Ledger.findOne({ account: account._id })
        .sort({ entryDate: -1 })
        .session(session);

      const previousBalance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;

      // Calculate balance for this transaction
      let balance = 0;
      if (account.normalBalance === 'debit') {
        balance = line.debitAmount - line.creditAmount;
      } else {
        balance = line.creditAmount - line.debitAmount;
      }

      // Calculate running balance
      const runningBalance = previousBalance + balance;

      // Create ledger entry
      await Ledger.create([{
        account: account._id,
        journalEntry: entry._id,
        journalLine: line._id,
        entryDate: entry.entryDate,
        description: line.description || entry.description,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        balance,
        runningBalance
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    return { success: true, message: 'Posted to ledger successfully' };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getLedgerByAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify account exists
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const filter = { account: accountId };
    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = new Date(startDate);
      if (endDate) filter.entryDate.$lte = new Date(endDate);
    }

    const ledgerEntries = await Ledger.find(filter)
      .populate('journalEntry', 'entryNumber entryDate referenceNumber')
      .populate('account', 'accountCode accountName accountType normalBalance')
      .sort({ entryDate: 1 });

    // Calculate opening balance
    let openingBalance = 0;
    if (startDate) {
      const openingEntries = await Ledger.find({
        account: accountId,
        entryDate: { $lt: new Date(startDate) }
      }).sort({ entryDate: -1 }).limit(1);
      
      if (openingEntries.length > 0) {
        openingBalance = openingEntries[0].runningBalance;
      }
    }

    res.json({
      account,
      openingBalance,
      ledgerEntries,
      closingBalance: ledgerEntries.length > 0 
        ? ledgerEntries[ledgerEntries.length - 1].runningBalance 
        : openingBalance
    });
  } catch (error) {
    console.error('Get ledger by account error:', error);
    res.status(500).json({ message: 'Server error fetching ledger' });
  }
};

const getGeneralLedger = async (req, res) => {
  try {
    const { accountType, startDate, endDate } = req.query;

    const filter = {};
    if (accountType) {
      const accounts = await Account.find({ accountType, isActive: true });
      const accountIds = accounts.map(a => a._id);
      filter.account = { $in: accountIds };
    }
    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = new Date(startDate);
      if (endDate) filter.entryDate.$lte = new Date(endDate);
    }

    const ledgerEntries = await Ledger.find(filter)
      .populate('journalEntry', 'entryNumber entryDate')
      .populate('account', 'accountCode accountName accountType normalBalance')
      .sort({ entryDate: 1, account: 1 });

    res.json({ ledgerEntries });
  } catch (error) {
    console.error('Get general ledger error:', error);
    res.status(500).json({ message: 'Server error fetching general ledger' });
  }
};

const postJournalEntryToLedger = async (req, res) => {
  try {
    const { entryId } = req.params;

    const journalEntry = await JournalEntry.findById(entryId);
    if (!journalEntry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    if (journalEntry.status !== 'posted') {
      return res.status(400).json({ 
        message: 'Journal entry must be posted before adding to ledger' 
      });
    }

    const result = await postToLedger(journalEntry);

    res.json(result);
  } catch (error) {
    console.error('Post to ledger error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error posting to ledger' 
    });
  }
};

const getAccountBalance = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { asOfDate } = req.query;

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const filter = { account: accountId };
    if (asOfDate) {
      filter.entryDate = { $lte: new Date(asOfDate) };
    }

    const lastLedgerEntry = await Ledger.findOne(filter)
      .sort({ entryDate: -1 });

    const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;

    res.json({
      account,
      balance,
      asOfDate: asOfDate || new Date()
    });
  } catch (error) {
    console.error('Get account balance error:', error);
    res.status(500).json({ message: 'Server error fetching account balance' });
  }
};

module.exports = {
  postToLedger,
  getLedgerByAccount,
  getGeneralLedger,
  postJournalEntryToLedger,
  getAccountBalance
};
