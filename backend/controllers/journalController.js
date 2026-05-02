const { JournalEntry, JournalLine, Account, TransactionTemplate } = require('../models');
const { postToLedger } = require('./ledgerController');
const { validationResult } = require('express-validator');

// Generate unique entry number
const generateEntryNumber = async () => {
  const count = await JournalEntry.countDocuments();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const sequence = String(count + 1).padStart(6, '0');
  return `JE${year}${month}${sequence}`;
};

const createJournalEntry = async (req, res) => {
  const session = await JournalEntry.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ errors: errors.array() });
    }

    const { entryDate, description, lines, templateId, referenceNumber, status } = req.body;

    let lineData = [];
    let totalDebit = 0;
    let totalCredit = 0;

    // If template is provided, generate lines from template
    if (templateId) {
      const template = await TransactionTemplate.findById(templateId).session(session);
      if (!template) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Template not found' });
      }

      if (!template.isActive) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Template is inactive' });
      }

      // Build lines from template
      for (const templateLine of template.lines) {
        const account = await Account.findById(templateLine.account).session(session);
        if (!account || !account.isActive) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ 
            message: `Account not found or inactive: ${templateLine.account}` 
          });
        }

        const amount = templateLine.isAmountFixed 
          ? templateLine.fixedAmount 
          : req.body.amount || 0;

        if (amount === 0) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ 
            message: 'Amount is required when using template with variable amounts' 
          });
        }

        lineData.push({
          account: templateLine.account,
          description: templateLine.description || description,
          debitAmount: templateLine.lineType === 'debit' ? amount : 0,
          creditAmount: templateLine.lineType === 'credit' ? amount : 0
        });

        totalDebit += templateLine.lineType === 'debit' ? amount : 0;
        totalCredit += templateLine.lineType === 'credit' ? amount : 0;
      }
    } else {
      // Manual lines
      if (!lines || lines.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Lines are required when not using template' });
      }

      for (const line of lines) {
        const account = await Account.findById(line.account).session(session);
        if (!account || !account.isActive) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ 
            message: `Account not found or inactive: ${line.account}` 
          });
        }

        lineData.push({
          account: line.account,
          description: line.description || description,
          debitAmount: line.debitAmount || 0,
          creditAmount: line.creditAmount || 0
        });

        totalDebit += line.debitAmount || 0;
        totalCredit += line.creditAmount || 0;
      }
    }

    // Validate debits equal credits
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: 'Journal entry is not balanced. Total debits must equal total credits.',
        totalDebit,
        totalCredit
      });
    }

    // Generate entry number
    const entryNumber = await generateEntryNumber();

    // Create journal entry first (without lines)
    const journalEntry = await JournalEntry.create([{
      entryNumber,
      entryDate: entryDate || new Date(),
      description,
      lines: [],
      totalDebit,
      totalCredit,
      status: status || 'draft',
      referenceNumber,
      templateUsed: templateId || null,
      createdBy: req.user._id,
      postedAt: status === 'posted' ? new Date() : null
    }], { session });

    // Now create journal lines with the journalEntry reference
    const journalLineIds = [];
    for (const line of lineData) {
      const journalLine = await JournalLine.create([{
        journalEntry: journalEntry[0]._id,
        ...line
      }], { session });
      journalLineIds.push(journalLine[0]._id);
    }

    // Update journal entry with the line references
    await JournalEntry.findByIdAndUpdate(
      journalEntry[0]._id,
      { lines: journalLineIds },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populatedEntry = await JournalEntry.findById(journalEntry[0]._id)
      .populate('lines')
      .populate({
        path: 'lines',
        populate: { path: 'account', select: 'accountCode accountName accountType' }
      })
      .populate('templateUsed', 'templateName templateCode')
      .populate('createdBy', 'username fullName');

    res.status(201).json({
      message: 'Journal entry created successfully',
      journalEntry: populatedEntry
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Create journal entry error:', error);
    res.status(500).json({ message: 'Server error creating journal entry' });
  }
};

const getAllJournalEntries = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = new Date(startDate);
      if (endDate) filter.entryDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const entries = await JournalEntry.find(filter)
      .populate('lines')
      .populate({
        path: 'lines',
        populate: { path: 'account', select: 'accountCode accountName accountType' }
      })
      .populate('templateUsed', 'templateName templateCode')
      .populate('createdBy', 'username fullName')
      .sort({ entryDate: -1, entryNumber: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JournalEntry.countDocuments(filter);

    res.json({ 
      entries, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ message: 'Server error fetching journal entries' });
  }
};

const getJournalEntryById = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id)
      .populate('lines')
      .populate({
        path: 'lines',
        populate: { path: 'account', select: 'accountCode accountName accountType normalBalance' }
      })
      .populate('templateUsed', 'templateName templateCode')
      .populate('createdBy', 'username fullName');

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json({ entry });
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ message: 'Server error fetching journal entry' });
  }
};

const updateJournalEntry = async (req, res) => {
  const session = await JournalEntry.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ errors: errors.array() });
    }

    const entry = await JournalEntry.findById(req.params.id).session(session);
    if (!entry) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    // Cannot modify posted entries
    if (entry.status === 'posted') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: 'Cannot modify posted journal entry' 
      });
    }

    const { entryDate, description, status, referenceNumber } = req.body;

    if (entryDate !== undefined) entry.entryDate = entryDate;
    if (description !== undefined) entry.description = description;
    if (referenceNumber !== undefined) entry.referenceNumber = referenceNumber;
    
    if (status !== undefined && status === 'posted') {
      entry.status = 'posted';
      entry.postedAt = new Date();
    }

    await entry.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populatedEntry = await JournalEntry.findById(entry._id)
      .populate('lines')
      .populate({
        path: 'lines',
        populate: { path: 'account', select: 'accountCode accountName accountType' }
      })
      .populate('createdBy', 'username fullName');

    res.json({
      message: 'Journal entry updated successfully',
      journalEntry: populatedEntry
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Update journal entry error:', error);
    res.status(500).json({ message: 'Server error updating journal entry' });
  }
};

const deleteJournalEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    // Cannot delete posted entries
    if (entry.status === 'posted') {
      return res.status(400).json({ 
        message: 'Cannot delete posted journal entry' 
      });
    }

    // Delete associated journal lines
    await JournalLine.deleteMany({ _id: { $in: entry.lines } });

    await JournalEntry.findByIdAndDelete(req.params.id);

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ message: 'Server error deleting journal entry' });
  }
};

const postJournalEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    if (entry.status === 'posted') {
      return res.status(400).json({ message: 'Journal entry is already posted' });
    }

    // Check if balanced
    if (Math.abs(entry.totalDebit - entry.totalCredit) > 0.01) {
      return res.status(400).json({ 
        message: 'Cannot post unbalanced journal entry' 
      });
    }

    entry.status = 'posted';
    entry.postedAt = new Date();
    await entry.save();

    // Automatically post to ledger
    try {
      await postToLedger(entry);
    } catch (ledgerError) {
      console.error('Auto-post to ledger failed:', ledgerError);
      // Continue with response even if ledger posting fails
    }

    res.json({
      message: 'Journal entry posted successfully',
      journalEntry: entry
    });
  } catch (error) {
    console.error('Post journal entry error:', error);
    res.status(500).json({ message: 'Server error posting journal entry' });
  }
};

module.exports = {
  createJournalEntry,
  getAllJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
  postJournalEntry
};
