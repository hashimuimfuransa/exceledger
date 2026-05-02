const { Ledger, Account } = require('../models');

const getIncomeStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Start date and end date are required for income statement' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get revenue accounts
    const revenueAccounts = await Account.find({ 
      accountType: 'revenue', 
      isActive: true 
    }).sort({ accountCode: 1 });

    // Get expense accounts
    const expenseAccounts = await Account.find({ 
      accountType: 'expense', 
      isActive: true 
    }).sort({ accountCode: 1 });

    let totalRevenue = 0;
    let totalExpenses = 0;
    const revenueDetails = [];
    const expenseDetails = [];

    // Calculate revenue for the period
    for (const account of revenueAccounts) {
      const revenueAmount = await Ledger.aggregate([
        {
          $match: {
            account: account._id,
            entryDate: { $gte: start, $lte: end }
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
        revenueDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount
        });
        totalRevenue += amount;
      }
    }

    // Calculate expenses for the period
    for (const account of expenseAccounts) {
      const expenseAmount = await Ledger.aggregate([
        {
          $match: {
            account: account._id,
            entryDate: { $gte: start, $lte: end }
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
        expenseDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount
        });
        totalExpenses += amount;
      }
    }

    const netIncome = totalRevenue - totalExpenses;

    res.json({
      period: { startDate: start, endDate: end },
      revenue: {
        details: revenueDetails,
        total: totalRevenue
      },
      expenses: {
        details: expenseDetails,
        total: totalExpenses
      },
      netIncome,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
    });
  } catch (error) {
    console.error('Generate income statement error:', error);
    res.status(500).json({ message: 'Server error generating income statement' });
  }
};

const getBalanceSheet = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();

    // Get all accounts by type
    const assetAccounts = await Account.find({ 
      accountType: 'asset', 
      isActive: true 
    }).sort({ accountCode: 1 });

    const liabilityAccounts = await Account.find({ 
      accountType: 'liability', 
      isActive: true 
    }).sort({ accountCode: 1 });

    const equityAccounts = await Account.find({ 
      accountType: 'equity', 
      isActive: true 
    }).sort({ accountCode: 1 });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    const assetDetails = [];
    const liabilityDetails = [];
    const equityDetails = [];

    // Calculate assets
    for (const account of assetAccounts) {
      const filter = { account: account._id, entryDate: { $lte: asOf } };
      const lastLedgerEntry = await Ledger.findOne(filter)
        .sort({ entryDate: -1 });

      const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;
      const amount = balance > 0 ? balance : 0;

      if (amount > 0) {
        assetDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount
        });
        totalAssets += amount;
      }
    }

    // Calculate liabilities
    for (const account of liabilityAccounts) {
      const filter = { account: account._id, entryDate: { $lte: asOf } };
      const lastLedgerEntry = await Ledger.findOne(filter)
        .sort({ entryDate: -1 });

      const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;
      const amount = balance > 0 ? balance : 0;

      if (amount > 0) {
        liabilityDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount
        });
        totalLiabilities += amount;
      }
    }

    // Calculate equity
    for (const account of equityAccounts) {
      const filter = { account: account._id, entryDate: { $lte: asOf } };
      const lastLedgerEntry = await Ledger.findOne(filter)
        .sort({ entryDate: -1 });

      const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;
      const amount = balance > 0 ? balance : 0;

      if (amount > 0) {
        equityDetails.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          amount
        });
        totalEquity += amount;
      }
    }

    // Validate balance sheet equation
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
    const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity));

    res.json({
      asOfDate: asOf,
      assets: {
        details: assetDetails,
        total: totalAssets
      },
      liabilities: {
        details: liabilityDetails,
        total: totalLiabilities
      },
      equity: {
        details: equityDetails,
        total: totalEquity
      },
      summary: {
        totalAssets,
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
        isBalanced,
        difference
      }
    });
  } catch (error) {
    console.error('Generate balance sheet error:', error);
    res.status(500).json({ message: 'Server error generating balance sheet' });
  }
};

const getCashFlowStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Start date and end date are required for cash flow statement' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get cash and bank accounts
    const cashAccounts = await Account.find({ 
      accountType: 'asset',
      subType: { $in: ['current_asset'] },
      isActive: true,
      $or: [
        { accountName: /cash/i },
        { accountName: /bank/i },
        { accountCode: /^1[01]/ } // Typical cash/bank account codes
      ]
    });

    if (cashAccounts.length === 0) {
      return res.status(400).json({ 
        message: 'No cash or bank accounts found' 
      });
    }

    let openingBalance = 0;
    let closingBalance = 0;
    let netCashFlow = 0;

    // Calculate opening and closing balances
    for (const account of cashAccounts) {
      // Opening balance
      const openingEntry = await Ledger.findOne({
        account: account._id,
        entryDate: { $lt: start }
      }).sort({ entryDate: -1 });

      openingBalance += openingEntry ? openingEntry.runningBalance : 0;

      // Closing balance
      const closingEntry = await Ledger.findOne({
        account: account._id,
        entryDate: { $lte: end }
      }).sort({ entryDate: -1 });

      closingBalance += closingEntry ? closingEntry.runningBalance : 0;
    }

    netCashFlow = closingBalance - openingBalance;

    // Get cash movements during the period
    const cashMovements = await Ledger.aggregate([
      {
        $match: {
          account: { $in: cashAccounts.map(a => a._id) },
          entryDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalInflows: { $sum: '$debitAmount' },
          totalOutflows: { $sum: '$creditAmount' }
        }
      }
    ]);

    const inflows = cashMovements.length > 0 ? cashMovements[0].totalInflows : 0;
    const outflows = cashMovements.length > 0 ? cashMovements[0].totalOutflows : 0;

    res.json({
      period: { startDate: start, endDate: end },
      cashAccounts: cashAccounts.map(a => ({
        accountCode: a.accountCode,
        accountName: a.accountName
      })),
      openingBalance,
      cashMovements: {
        inflows,
        outflows,
        netFlow: inflows - outflows
      },
      closingBalance,
      netCashFlow,
      reconciliation: {
        openingBalance,
        netChange: inflows - outflows,
        closingBalance,
        matches: Math.abs(closingBalance - (openingBalance + inflows - outflows)) < 0.01
      }
    });
  } catch (error) {
    console.error('Generate cash flow statement error:', error);
    res.status(500).json({ message: 'Server error generating cash flow statement' });
  }
};

const getGeneralJournal = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = new Date(startDate);
      if (endDate) filter.entryDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const journalEntries = await Ledger.find(filter)
      .populate('journalEntry', 'entryNumber entryDate description')
      .populate('account', 'accountCode accountName accountType')
      .sort({ entryDate: 1, account: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ledger.countDocuments(filter);

    res.json({
      journalEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get general journal error:', error);
    res.status(500).json({ message: 'Server error fetching general journal' });
  }
};

const getFinancialSummary = async (req, res) => {
  try {
    const { period } = req.query; // 'monthly', 'yearly', or custom dates
    
    let startDate, endDate;
    const now = new Date();

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      // Default to current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get income statement summary
    const revenueResult = await Ledger.aggregate([
      {
        $lookup: {
          from: 'accounts',
          localField: 'account',
          foreignField: '_id',
          as: 'accountInfo'
        }
      },
      {
        $unwind: '$accountInfo'
      },
      {
        $match: {
          'accountInfo.accountType': 'revenue',
          entryDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$creditAmount' }
        }
      }
    ]);

    const expenseResult = await Ledger.aggregate([
      {
        $lookup: {
          from: 'accounts',
          localField: 'account',
          foreignField: '_id',
          as: 'accountInfo'
        }
      },
      {
        $unwind: '$accountInfo'
      },
      {
        $match: {
          'accountInfo.accountType': 'expense',
          entryDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$debitAmount' }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const totalExpenses = expenseResult.length > 0 ? expenseResult[0].totalExpenses : 0;
    const netIncome = totalRevenue - totalExpenses;

    // Get cash balance
    const cashAccounts = await Account.find({ 
      accountType: 'asset',
      $or: [
        { accountName: /cash/i },
        { accountName: /bank/i }
      ]
    });

    let totalCash = 0;
    for (const account of cashAccounts) {
      const lastLedgerEntry = await Ledger.findOne({ account: account._id })
        .sort({ entryDate: -1 });
      const balance = lastLedgerEntry ? lastLedgerEntry.runningBalance : 0;
      totalCash += balance > 0 ? balance : 0;
    }

    res.json({
      period: { startDate, endDate, type: period || 'monthly' },
      summary: {
        totalRevenue,
        totalExpenses,
        netIncome,
        profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
        totalCash
      }
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({ message: 'Server error fetching financial summary' });
  }
};

module.exports = {
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getGeneralJournal,
  getFinancialSummary
};
