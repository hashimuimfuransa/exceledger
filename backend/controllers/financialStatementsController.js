const { Ledger, Account } = require('../models');
const Settings = require('../models/Settings');

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

    console.log('Income Statement Debug - Using trial balance data for period:', start, 'to', end);

    // Generate trial balance data for the period - this will be our source of truth
    const accounts = await Account.find({ 
      isActive: true,
      accountType: { $in: ['revenue', 'expense'] }
    }).sort({ accountCode: 1 });

    const trialBalance = [];
    for (const account of accounts) {
      // Get activity for the period (not just balance as of date)
      const periodActivity = await Ledger.aggregate([
        {
          $match: {
            account: account._id,
            entryDate: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalDebits: { $sum: '$debitAmount' },
            totalCredits: { $sum: '$creditAmount' }
          }
        }
      ]);

      const activity = periodActivity.length > 0 ? periodActivity[0] : { totalDebits: 0, totalCredits: 0 };

      let debitAmount = 0;
      let creditAmount = 0;

      // For income statement, we want the period activity, not the running balance
      if (account.accountType === 'revenue') {
        // Revenue accounts: credits increase revenue
        creditAmount = activity.totalCredits;
        debitAmount = activity.totalDebits; // Usually returns/allowances
      } else if (account.accountType === 'expense') {
        // Expense accounts: debits increase expenses
        debitAmount = activity.totalDebits;
        creditAmount = activity.totalCredits; // Usually reductions/allowances
      }

      // Only include accounts with activity
      if (debitAmount > 0 || creditAmount > 0) {
        trialBalance.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          normalBalance: account.normalBalance,
          debitAmount,
          creditAmount
        });
      }
    }

    console.log('Income Statement Debug - Trial balance entries:', trialBalance.length);

    let totalRevenue = 0;
    let totalExpenses = 0;
    const revenueDetails = [];
    const expenseDetails = [];

    // Process trial balance data for income statement
    for (const entry of trialBalance) {
      const { accountCode, accountName, accountType, debitAmount, creditAmount } = entry;
      
      if (accountType === 'revenue') {
        // Revenue: use credit amount (normal balance)
        const amount = creditAmount - debitAmount; // Net revenue
        if (amount > 0) {
          revenueDetails.push({
            accountCode,
            accountName,
            amount
          });
          totalRevenue += amount;
        }
      } else if (accountType === 'expense') {
        // Expenses: use debit amount (normal balance)
        const amount = debitAmount - creditAmount; // Net expense
        if (amount > 0) {
          expenseDetails.push({
            accountCode,
            accountName,
            amount
          });
          totalExpenses += amount;
        }
      }
    }

    const netIncome = totalRevenue - totalExpenses;

    // Calculate interest expenses using trial balance data
    let interestExpenses = 0;
    const interestExpenseDetails = [];
    
    // Filter trial balance for interest expense accounts
    const interestEntries = trialBalance.filter(entry => 
      entry.accountType === 'expense' && 
      (entry.accountName.toLowerCase().includes('interest') || entry.accountCode.startsWith('68'))
    );

    for (const entry of interestEntries) {
      const amount = entry.debitAmount - entry.creditAmount; // Net interest expense
      if (amount > 0) {
        interestExpenseDetails.push({
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          amount
        });
        interestExpenses += amount;
      }
    }

    // Get settings for tax and interest rates first
    const settings = await Settings.getSettings();
    console.log('Retrieved settings in financial statements:', settings);
    const configuredInterestRate = settings.interestRate !== undefined ? settings.interestRate : 0.15; // Default to 15% if not set

    // Calculate PBIT (Profit Before Interest and Tax)
    // PBIT is the same as Gross Profit (Revenue - Total Expenses) because it's BEFORE interest and tax deductions
    const grossProfit = totalRevenue - totalExpenses;
    const pbit = grossProfit;

    // Calculate interest expenses (separate from PBIT calculation)
    // Always calculate based on interest rate from settings if no actual interest transactions exist
    console.log('Interest calculation debug:', {
      actualInterestExpenses: interestExpenses,
      configuredInterestRate: configuredInterestRate,
      grossProfit: grossProfit,
      pbit: pbit
    });
    
    if (interestExpenses === 0 && pbit > 0) {
      // Calculate interest expense based on configured rate
      const calculatedInterestExpenses = grossProfit * configuredInterestRate;
      console.log('Calculated interest expenses:', calculatedInterestExpenses);
      interestExpenses = calculatedInterestExpenses;
      
      // Add to interest expense details for reporting
      interestExpenseDetails.push({
        accountCode: 'CONFIG',
        accountName: 'Configured Interest Rate',
        amount: calculatedInterestExpenses
      });
    }

    // Calculate tax expenses using trial balance data
    let taxExpenses = 0;
    const taxExpenseDetails = [];
    let taxRate = 0; // Default tax rate (can be configured)
    
    // Filter trial balance for tax expense accounts
    const taxEntries = trialBalance.filter(entry => 
      entry.accountType === 'expense' && 
      (entry.accountName.toLowerCase().includes('tax') || entry.accountCode.startsWith('69'))
    );

    for (const entry of taxEntries) {
      const amount = entry.debitAmount - entry.creditAmount; // Net tax expense
      if (amount > 0) {
        taxExpenseDetails.push({
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          amount
        });
        taxExpenses += amount;
      }
    }

    // If no tax expenses found, calculate based on tax rate from settings
    if (taxExpenses === 0 && pbit > 0) {
      taxRate = settings.taxRate || 0.30; // Default to 30% if not set
      taxExpenses = pbit * taxRate;
    }

    // Calculate PBT (Profit Before Tax) = PBIT - Interest Expenses
    const pbt = pbit - interestExpenses;
    console.log('PBT calculation debug:', {
      pbit: pbit,
      interestExpenses: interestExpenses,
      calculatedPbt: pbt
    });

    // Calculate Net Income after tax
    const netIncomeAfterTax = pbt - taxExpenses;

    res.json({
      period: { startDate: start, endDate: end },
      revenue: {
        details: revenueDetails,
        total: totalRevenue
      },
      expenses: {
        details: expenseDetails,
        total: totalExpenses,
        interestExpenses: {
          details: interestExpenseDetails,
          total: interestExpenses,
          interestRate: (settings?.interestRate || 0.15) * 100
        },
        taxExpenses: {
          details: taxExpenseDetails,
          total: taxExpenses,
          taxRate: taxRate * 100
        }
      },
      profitMetrics: {
        operatingProfit: grossProfit,
        grossProfit: grossProfit,
        grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        pbit: pbit,
        pbt: pbt,
        interestExpenses: interestExpenses,
        interestRate: (settings?.interestRate || 0.15) * 100,
        taxExpenses: taxExpenses,
        taxRate: taxRate * 100,
        netIncome: netIncomeAfterTax,
        netMargin: totalRevenue > 0 ? (netIncomeAfterTax / totalRevenue) * 100 : 0
      },
      netIncome: netIncomeAfterTax,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      source: 'trial_balance' // Indicate data source
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

    console.log('Balance Sheet Debug - Using trial balance data as of:', asOf);

    // Generate trial balance data directly - this will be our source of truth
    const accounts = await Account.find({ isActive: true })
      .sort({ accountCode: 1 });

    const trialBalance = [];
    for (const account of accounts) {
      // Get balance for each account as of the specified date
      const filter = { account: account._id, entryDate: { $lte: asOf } };
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

      // Only include accounts with non-zero balances
      if (debitAmount > 0 || creditAmount > 0) {
        trialBalance.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          normalBalance: account.normalBalance,
          debitAmount,
          creditAmount
        });
      }
    }

    console.log('Balance Sheet Debug - Trial balance entries:', trialBalance.length);

    // Define account categories for grouping
    const assetCategories = {
      'Current Assets': {
        codes: ['1001', '1002', '1003', '1004', '1005'],
        description: 'Cash and assets expected to be converted to cash within one year',
        accounts: []
      },
      'Fixed Assets': {
        codes: ['1501', '1502', '1503', '1504'],
        description: 'Long-term tangible assets used in operations',
        accounts: []
      },
      'Other Assets': {
        codes: ['1801', '1802', '1803'],
        description: 'Other non-current assets',
        accounts: []
      }
    };

    const liabilityCategories = {
      'Current Liabilities': {
        codes: ['2001', '2002', '2003'],
        description: 'Obligations due within one year',
        accounts: []
      },
      'Long-term Liabilities': {
        codes: ['2501', '2502', '2503'],
        description: 'Obligations due after one year',
        accounts: []
      },
      'Other Liabilities': {
        codes: ['2801', '2802'],
        description: 'Other non-current liabilities',
        accounts: []
      }
    };

    const equityCategories = {
      'Owner Equity': {
        codes: ['3001'],
        description: 'Owner investments and withdrawals',
        accounts: []
      },
      'Retained Earnings': {
        codes: ['3002'],
        description: 'Accumulated profits and losses',
        accounts: []
      },
      'Other Equity': {
        codes: ['3101', '3102'],
        description: 'Other equity components',
        accounts: []
      }
    };

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    // Process trial balance data and group accounts by category
    for (const entry of trialBalance) {
      const { accountCode, accountName, accountType, debitAmount, creditAmount } = entry;
      
      // Calculate the balance sheet amount based on account type and normal balance
      let amount = 0;
      
      if (accountType === 'asset') {
        // Assets: normal debit balance, so use debit amount
        amount = debitAmount;
        if (amount > 0) {
          totalAssets += amount;
          
          // Find appropriate category for this asset
          let categoryFound = false;
          for (const [categoryName, category] of Object.entries(assetCategories)) {
            if (category.codes.some(code => accountCode.startsWith(code))) {
              category.accounts.push({
                accountCode,
                accountName,
                amount
              });
              categoryFound = true;
              break;
            }
          }
          
          // If no specific category found, add to Other Assets
          if (!categoryFound) {
            assetCategories['Other Assets'].accounts.push({
              accountCode,
              accountName,
              amount
            });
          }
        }
      } else if (accountType === 'liability') {
        // Liabilities: normal credit balance, so use credit amount
        amount = creditAmount;
        if (amount > 0) {
          totalLiabilities += amount;
          
          // Find appropriate category for this liability
          let categoryFound = false;
          for (const [categoryName, category] of Object.entries(liabilityCategories)) {
            if (category.codes.some(code => accountCode.startsWith(code))) {
              category.accounts.push({
                accountCode,
                accountName,
                amount
              });
              categoryFound = true;
              break;
            }
          }
          
          // If no specific category found, add to Other Liabilities
          if (!categoryFound) {
            liabilityCategories['Other Liabilities'].accounts.push({
              accountCode,
              accountName,
              amount
            });
          }
        }
      } else if (accountType === 'equity') {
        // Equity: normal credit balance, so use credit amount
        amount = creditAmount;
        if (amount > 0) {
          totalEquity += amount;
          
          // Find appropriate category for this equity
          let categoryFound = false;
          for (const [categoryName, category] of Object.entries(equityCategories)) {
            if (category.codes.some(code => accountCode.startsWith(code))) {
              category.accounts.push({
                accountCode,
                accountName,
                amount
              });
              categoryFound = true;
              break;
            }
          }
          
          // If no specific category found, add to Other Equity
          if (!categoryFound) {
            equityCategories['Other Equity'].accounts.push({
              accountCode,
              accountName,
              amount
            });
          }
        }
      }
    }

    // Calculate subtotals for each category
    for (const category of Object.values(assetCategories)) {
      category.subtotal = category.accounts.reduce((sum, account) => sum + account.amount, 0);
    }

    for (const category of Object.values(liabilityCategories)) {
      category.subtotal = category.accounts.reduce((sum, account) => sum + account.amount, 0);
    }

    for (const category of Object.values(equityCategories)) {
      category.subtotal = category.accounts.reduce((sum, account) => sum + account.amount, 0);
    }

    console.log('Balance Sheet Debug - Totals from trial balance:', {
      totalAssets,
      totalLiabilities,
      totalEquity,
      assetCategories: Object.keys(assetCategories).length,
      liabilityCategories: Object.keys(liabilityCategories).length,
      equityCategories: Object.keys(equityCategories).length
    });

    // Validate balance sheet equation
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
    const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity));

    console.log('Balance Sheet Debug - Final Summary:', {
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced,
      difference,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    });

    res.json({
      asOfDate: asOf,
      assets: {
        categories: assetCategories,
        total: totalAssets
      },
      liabilities: {
        categories: liabilityCategories,
        total: totalLiabilities
      },
      equity: {
        categories: equityCategories,
        total: totalEquity
      },
      summary: {
        totalAssets,
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
        isBalanced,
        difference
      },
      source: 'trial_balance' // Indicate data source
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

    console.log('Cash Flow Debug - Using trial balance data for period:', start, 'to', end);

    // Get cash and bank accounts using trial balance approach
    const cashAccounts = await Account.find({ 
      accountType: 'asset',
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

    // Generate trial balance data for cash accounts to get opening and closing balances
    let openingBalance = 0;
    let closingBalance = 0;

    for (const account of cashAccounts) {
      // Opening balance (before period start)
      const openingFilter = { account: account._id, entryDate: { $lt: start } };
      const openingEntry = await Ledger.findOne(openingFilter).sort({ entryDate: -1 });
      
      const openingBalanceAmount = openingEntry ? openingEntry.runningBalance : 0;
      // For cash accounts, negative balance means positive cash (like assets)
      openingBalance += openingBalanceAmount < 0 ? Math.abs(openingBalanceAmount) : 0;

      // Closing balance (as of period end)
      const closingFilter = { account: account._id, entryDate: { $lte: end } };
      const closingEntry = await Ledger.findOne(closingFilter).sort({ entryDate: -1 });
      
      const closingBalanceAmount = closingEntry ? closingEntry.runningBalance : 0;
      closingBalance += closingBalanceAmount < 0 ? Math.abs(closingBalanceAmount) : 0;
    }

    const netCashFlow = closingBalance - openingBalance;

    // Get cash movements during the period using trial balance approach
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
      },
      source: 'trial_balance' // Indicate data source
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
