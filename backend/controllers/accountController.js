const { Account } = require('../models');
const { validationResult } = require('express-validator');

const createAccount = async (req, res) => {
  try {
    console.log('=== CREATE ACCOUNT DEBUG ===');
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountCode, accountName, accountType, subType, normalBalance, description, parentId } = req.body;

    // Check if account code already exists
    const existingAccount = await Account.findOne({ accountCode });
    if (existingAccount) {
      return res.status(400).json({ message: 'Account code already exists' });
    }

    // Validate normal balance based on account type
    const assetExpenseTypes = ['asset', 'expense'];
    const liabilityEquityRevenueTypes = ['liability', 'equity', 'revenue'];
    
    if (assetExpenseTypes.includes(accountType) && normalBalance !== 'debit') {
      return res.status(400).json({ message: 'Asset and expense accounts must have debit normal balance' });
    }
    
    if (liabilityEquityRevenueTypes.includes(accountType) && normalBalance !== 'credit') {
      return res.status(400).json({ message: 'Liability, equity, and revenue accounts must have credit normal balance' });
    }

    // Validate parent account if provided
    if (parentId) {
      const parentAccount = await Account.findById(parentId);
      if (!parentAccount) {
        return res.status(400).json({ message: 'Parent account not found' });
      }
      if (!parentAccount.isActive) {
        return res.status(400).json({ message: 'Parent account is inactive' });
      }
    }

    const account = await Account.create({
      accountCode,
      accountName,
      accountType,
      subType,
      normalBalance,
      description,
      parentId
    });

    res.status(201).json({
      message: 'Account created successfully',
      account
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Server error creating account' });
  }
};

const getAllAccounts = async (req, res) => {
  try {
    const { accountType, isActive } = req.query;
    
    const filter = {};
    if (accountType) filter.accountType = accountType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const accounts = await Account.find(filter)
      .populate('parentId', 'accountCode accountName')
      .sort({ accountCode: 1 });

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error fetching accounts' });
  }
};

const getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('parentId', 'accountCode accountName');

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ account });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Server error fetching account' });
  }
};

const updateAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const { accountName, accountType, subType, normalBalance, description, parentId, isActive } = req.body;

    // Check if account has been used in journal entries
    const { JournalLine } = require('../models');
    const usedInJournal = await JournalLine.findOne({ account: account._id });
    if (usedInJournal) {
      // Only allow updating description and isActive for used accounts
      if (accountName || accountType || subType || normalBalance || parentId) {
        return res.status(400).json({ 
          message: 'Cannot modify account code, type, or balance for accounts already used in transactions' 
        });
      }
    }

    // Update allowed fields
    if (accountName !== undefined) account.accountName = accountName;
    if (accountType !== undefined) account.accountType = accountType;
    if (subType !== undefined) account.subType = subType;
    if (normalBalance !== undefined) account.normalBalance = normalBalance;
    if (description !== undefined) account.description = description;
    if (parentId !== undefined) account.parentId = parentId;
    if (isActive !== undefined) account.isActive = isActive;

    await account.save();

    res.json({
      message: 'Account updated successfully',
      account
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error updating account' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Check if account has been used in journal entries
    const { JournalLine } = require('../models');
    const usedInJournal = await JournalLine.findOne({ account: account._id });
    if (usedInJournal) {
      return res.status(400).json({ 
        message: 'Cannot delete account that has been used in transactions' 
      });
    }

    // Check if account has child accounts
    const childAccounts = await Account.find({ parentId: account._id });
    if (childAccounts.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account that has child accounts' 
      });
    }

    await Account.findByIdAndDelete(req.params.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
};

const getAccountsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    const accounts = await Account.find({ accountType: type, isActive: true })
      .sort({ accountCode: 1 });

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts by type error:', error);
    res.status(500).json({ message: 'Server error fetching accounts by type' });
  }
};

module.exports = {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  getAccountsByType
};
