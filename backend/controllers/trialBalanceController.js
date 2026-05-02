const { Ledger, Account } = require('../models');

const generateTrialBalance = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    
    // Get all active accounts
    const accounts = await Account.find({ isActive: true })
      .sort({ accountCode: 1 });

    const trialBalance = [];
    let totalDebits = 0;
    let totalCredits = 0;

    for (const account of accounts) {
      // Get balance for each account as of the specified date
      const filter = { account: account._id };
      if (asOfDate) {
        filter.entryDate = { $lte: new Date(asOfDate) };
      }

      const lastLedgerEntry = await Ledger.findOne(filter)
        .sort({ entryDate: -1 });

      const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;

      let debitAmount = 0;
      let creditAmount = 0;

      // Determine debit or credit based on account normal balance
      if (account.normalBalance === 'debit') {
        debitAmount = balance > 0 ? balance : 0;
        creditAmount = balance < 0 ? Math.abs(balance) : 0;
      } else {
        creditAmount = balance > 0 ? balance : 0;
        debitAmount = balance < 0 ? Math.abs(balance) : 0;
      }

      // Only include accounts with non-zero balances or include all for full trial balance
      if (debitAmount > 0 || creditAmount > 0) {
        trialBalance.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          normalBalance: account.normalBalance,
          debitAmount,
          creditAmount
        });

        totalDebits += debitAmount;
        totalCredits += creditAmount;
      }
    }

    // Check if trial balance is balanced
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
    const difference = Math.abs(totalDebits - totalCredits);

    res.json({
      trialBalance,
      summary: {
        totalDebits,
        totalCredits,
        isBalanced,
        difference
      },
      asOfDate: asOfDate || new Date()
    });
  } catch (error) {
    console.error('Generate trial balance error:', error);
    res.status(500).json({ message: 'Server error generating trial balance' });
  }
};

const getTrialBalanceByType = async (req, res) => {
  try {
    const { accountType } = req.params;
    const { asOfDate } = req.query;

    if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(accountType)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    const accounts = await Account.find({ 
      accountType, 
      isActive: true 
    }).sort({ accountCode: 1 });

    const trialBalance = [];
    let totalDebits = 0;
    let totalCredits = 0;

    for (const account of accounts) {
      const filter = { account: account._id };
      if (asOfDate) {
        filter.entryDate = { $lte: new Date(asOfDate) };
      }

      const lastLedgerEntry = await Ledger.findOne(filter)
        .sort({ entryDate: -1 });

      const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;

      let debitAmount = 0;
      let creditAmount = 0;

      if (account.normalBalance === 'debit') {
        debitAmount = balance > 0 ? balance : 0;
        creditAmount = balance < 0 ? Math.abs(balance) : 0;
      } else {
        creditAmount = balance > 0 ? balance : 0;
        debitAmount = balance < 0 ? Math.abs(balance) : 0;
      }

      if (debitAmount > 0 || creditAmount > 0) {
        trialBalance.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          normalBalance: account.normalBalance,
          debitAmount,
          creditAmount
        });

        totalDebits += debitAmount;
        totalCredits += creditAmount;
      }
    }

    res.json({
      accountType,
      trialBalance,
      summary: {
        totalDebits,
        totalCredits,
        isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
      },
      asOfDate: asOfDate || new Date()
    });
  } catch (error) {
    console.error('Get trial balance by type error:', error);
    res.status(500).json({ message: 'Server error fetching trial balance by type' });
  }
};

const getTrialBalanceSummary = async (req, res) => {
  try {
    const { asOfDate } = req.query;

    // Get summary by account type
    const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    const summary = {};

    for (const type of accountTypes) {
      const accounts = await Account.find({ 
        accountType: type, 
        isActive: true 
      });

      let totalDebits = 0;
      let totalCredits = 0;

      for (const account of accounts) {
        const filter = { account: account._id };
        if (asOfDate) {
          filter.entryDate = { $lte: new Date(asOfDate) };
        }

        const lastLedgerEntry = await Ledger.findOne(filter)
          .sort({ entryDate: -1 });

        const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;

        if (account.normalBalance === 'debit') {
          totalDebits += balance > 0 ? balance : 0;
          totalCredits += balance < 0 ? Math.abs(balance) : 0;
        } else {
          totalCredits += balance > 0 ? balance : 0;
          totalDebits += balance < 0 ? Math.abs(balance) : 0;
        }
      }

      summary[type] = {
        totalDebits,
        totalCredits,
        netBalance: totalDebits - totalCredits
      };
    }

    // Calculate overall totals
    const overallDebits = Object.values(summary).reduce((sum, item) => sum + item.totalDebits, 0);
    const overallCredits = Object.values(summary).reduce((sum, item) => sum + item.totalCredits, 0);

    res.json({
      summary,
      overall: {
        totalDebits: overallDebits,
        totalCredits: overallCredits,
        isBalanced: Math.abs(overallDebits - overallCredits) < 0.01,
        difference: Math.abs(overallDebits - overallCredits)
      },
      asOfDate: asOfDate || new Date()
    });
  } catch (error) {
    console.error('Get trial balance summary error:', error);
    res.status(500).json({ message: 'Server error fetching trial balance summary' });
  }
};

const validateTrialBalance = async (req, res) => {
  try {
    const { asOfDate } = req.query;

    // Get all accounts and their balances
    const accounts = await Account.find({ isActive: true });

    let totalDebits = 0;
    let totalCredits = 0;
    const imbalances = [];

    for (const account of accounts) {
      const filter = { account: account._id };
      if (asOfDate) {
        filter.entryDate = { $lte: new Date(asOfDate) };
      }

      const lastLedgerEntry = await Ledger.findOne(filter)
        .sort({ entryDate: -1 });

      const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;

      let debitAmount = 0;
      let creditAmount = 0;

      if (account.normalBalance === 'debit') {
        debitAmount = balance > 0 ? balance : 0;
        creditAmount = balance < 0 ? Math.abs(balance) : 0;
      } else {
        creditAmount = balance > 0 ? balance : 0;
        debitAmount = balance < 0 ? Math.abs(balance) : 0;
      }

      totalDebits += debitAmount;
      totalCredits += creditAmount;

      // Check for potential issues
      if (account.normalBalance === 'debit' && creditAmount > debitAmount) {
        imbalances.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          issue: 'Debit-normal account has credit balance',
          balance: balance
        });
      }

      if (account.normalBalance === 'credit' && debitAmount > creditAmount) {
        imbalances.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          issue: 'Credit-normal account has debit balance',
          balance: balance
        });
      }
    }

    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
    const difference = Math.abs(totalDebits - totalCredits);

    res.json({
      isValid: isBalanced && imbalances.length === 0,
      isBalanced,
      difference,
      totalDebits,
      totalCredits,
      imbalances,
      asOfDate: asOfDate || new Date()
    });
  } catch (error) {
    console.error('Validate trial balance error:', error);
    res.status(500).json({ message: 'Server error validating trial balance' });
  }
};

module.exports = {
  generateTrialBalance,
  getTrialBalanceByType,
  getTrialBalanceSummary,
  validateTrialBalance
};
