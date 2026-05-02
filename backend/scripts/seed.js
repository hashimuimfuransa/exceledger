const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Account = require('../models/Account');
const TransactionTemplate = require('../models/TransactionTemplate');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exceledger');
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data and drop collections to remove problematic indexes
    await User.collection.drop();
    await Account.collection.drop();
    await TransactionTemplate.collection.drop();
    console.log('Dropped existing collections');

    // Hash password
    const password = 'ECH.Info@12345';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create users
    const users = [
      {
        username: 'admin',
        email: 'admin@excellencecoaching.com',
        password: hashedPassword,
        role: 'admin',
        fullName: 'Administrator',
        isActive: true
      },
      {
        username: 'saudausanase',
        email: 'sauda@excellencecoaching.com',
        password: hashedPassword,
        role: 'admin',
        fullName: 'Sauda Usanase',
        isActive: true
      },
      {
        username: 'johncoach',
        email: 'john@excellencecoaching.com',
        password: hashedPassword,
        role: 'admin',
        fullName: 'John Coach',
        isActive: true
      },
      {
        username: 'sarahmanager',
        email: 'sarah@excellencecoaching.com',
        password: hashedPassword,
        role: 'admin',
        fullName: 'Sarah Manager',
        isActive: true
      },
      {
        username: 'mikeuser',
        email: 'mike@excellencecoaching.com',
        password: hashedPassword,
        role: 'user',
        fullName: 'Mike User',
        isActive: true
      },
      {
        username: 'lisaviewer',
        email: 'lisa@excellencecoaching.com',
        password: hashedPassword,
        role: 'user',
        fullName: 'Lisa Viewer',
        isActive: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created users:', createdUsers.length);

    // Create chart of accounts
    const accounts = [
      // Assets
      { accountCode: '1001', accountName: 'Cash', accountType: 'asset', subType: 'current_asset', normalBalance: 'debit', isActive: true },
      { accountCode: '1002', accountName: 'Bank Account', accountType: 'asset', subType: 'current_asset', normalBalance: 'debit', isActive: true },
      { accountCode: '1003', accountName: 'Accounts Receivable', accountType: 'asset', subType: 'current_asset', normalBalance: 'debit', isActive: true },
      { accountCode: '1004', accountName: 'Equipment', accountType: 'asset', subType: 'fixed_asset', normalBalance: 'debit', isActive: true },
      { accountCode: '1005', accountName: 'Prepaid Expenses', accountType: 'asset', subType: 'current_asset', normalBalance: 'debit', isActive: true },
      
      // Liabilities
      { accountCode: '2001', accountName: 'Accounts Payable', accountType: 'liability', subType: 'current_liability', normalBalance: 'credit', isActive: true },
      { accountCode: '2002', accountName: 'Loans Payable', accountType: 'liability', subType: 'long_term_liability', normalBalance: 'credit', isActive: true },
      { accountCode: '2003', accountName: 'Accrued Expenses', accountType: 'liability', subType: 'current_liability', normalBalance: 'credit', isActive: true },
      
      // Equity
      { accountCode: '3001', accountName: 'Owner Capital', accountType: 'equity', subType: 'owner_equity', normalBalance: 'credit', isActive: true },
      { accountCode: '3002', accountName: 'Retained Earnings', accountType: 'equity', subType: 'retained_earnings', normalBalance: 'credit', isActive: true },
      
      // Revenue
      { accountCode: '4001', accountName: 'Tuition Fees', accountType: 'revenue', subType: 'operating_revenue', normalBalance: 'credit', isActive: true },
      { accountCode: '4002', accountName: 'Coaching Income', accountType: 'revenue', subType: 'operating_revenue', normalBalance: 'credit', isActive: true },
      { accountCode: '4003', accountName: 'Consulting Income', accountType: 'revenue', subType: 'operating_revenue', normalBalance: 'credit', isActive: true },
      { accountCode: '4004', accountName: 'Training Income', accountType: 'revenue', subType: 'operating_revenue', normalBalance: 'credit', isActive: true },
      { accountCode: '4005', accountName: 'Other Revenue', accountType: 'revenue', subType: 'other_revenue', normalBalance: 'credit', isActive: true },
      
      // Expenses
      { accountCode: '5001', accountName: 'Salaries', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit', isActive: true },
      { accountCode: '5002', accountName: 'Rent', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit', isActive: true },
      { accountCode: '5003', accountName: 'Transport', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit', isActive: true },
      { accountCode: '5004', accountName: 'Internet', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit', isActive: true },
      { accountCode: '5005', accountName: 'Marketing', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit', isActive: true },
      { accountCode: '5006', accountName: 'Office Supplies', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit', isActive: true },
      { accountCode: '5007', accountName: 'Utilities', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit', isActive: true },
      { accountCode: '5008', accountName: 'Other Expenses', accountType: 'expense', subType: 'other_expense', normalBalance: 'debit', isActive: true }
    ];

    const createdAccounts = await Account.insertMany(accounts);
    console.log('Created accounts:', createdAccounts.length);

    // Get account IDs for templates
    const cashAccount = createdAccounts.find(a => a.accountCode === '1001');
    const bankAccount = createdAccounts.find(a => a.accountCode === '1002');
    const arAccount = createdAccounts.find(a => a.accountCode === '1003');
    const apAccount = createdAccounts.find(a => a.accountCode === '2001');
    const tuitionRevenue = createdAccounts.find(a => a.accountCode === '4001');
    const coachingRevenue = createdAccounts.find(a => a.accountCode === '4002');
    const consultingRevenue = createdAccounts.find(a => a.accountCode === '4003');
    const trainingRevenue = createdAccounts.find(a => a.accountCode === '4004');
    const salariesExpense = createdAccounts.find(a => a.accountCode === '5001');
    const rentExpense = createdAccounts.find(a => a.accountCode === '5002');
    const marketingExpense = createdAccounts.find(a => a.accountCode === '5005');
    const suppliesExpense = createdAccounts.find(a => a.accountCode === '5006');
    
    // Get admin user for createdBy field
    const adminUser = createdUsers.find(u => u.role === 'admin');

    // Create transaction templates
    const templates = [
      // Revenue templates
      {
        templateName: 'Tuition Payment',
        templateCode: 'TP001',
        description: 'Receive tuition fee payment from student',
        category: 'revenue',
        lines: [
          { account: cashAccount._id, lineType: 'debit', isPaymentMethod: true },
          { account: tuitionRevenue._id, lineType: 'credit' }
        ],
        isActive: true,
        createdBy: adminUser._id
      },
      {
        templateName: 'Coaching Payment',
        templateCode: 'CP001',
        description: 'Receive payment for coaching services',
        category: 'revenue',
        lines: [
          { account: bankAccount._id, lineType: 'debit', isPaymentMethod: true },
          { account: coachingRevenue._id, lineType: 'credit' }
        ],
        isActive: true,
        createdBy: adminUser._id
      },
      {
        templateName: 'Consulting Fee',
        templateCode: 'CF001',
        description: 'Receive payment for consulting services',
        category: 'revenue',
        lines: [
          { account: bankAccount._id, lineType: 'debit', isPaymentMethod: true },
          { account: consultingRevenue._id, lineType: 'credit' }
        ],
        isActive: true,
        createdBy: adminUser._id
      },
      {
        templateName: 'Training Fee',
        templateCode: 'TF001',
        description: 'Receive payment for training programs',
        category: 'revenue',
        lines: [
          { account: cashAccount._id, lineType: 'debit', isPaymentMethod: true },
          { account: trainingRevenue._id, lineType: 'credit' }
        ],
        isActive: true,
        createdBy: adminUser._id
      },
      
      // Expense templates
      {
        templateName: 'Salary Payment',
        templateCode: 'SP001',
        description: 'Pay staff salaries',
        category: 'expense',
        lines: [
          { account: salariesExpense._id, lineType: 'debit' },
          { account: bankAccount._id, lineType: 'credit', isPaymentMethod: true }
        ],
        isActive: true,
        createdBy: adminUser._id
      },
      {
        templateName: 'Rent Payment',
        templateCode: 'RP001',
        description: 'Pay monthly rent',
        category: 'expense',
        lines: [
          { account: rentExpense._id, lineType: 'debit' },
          { account: bankAccount._id, lineType: 'credit', isPaymentMethod: true }
        ],
        isActive: true,
        createdBy: adminUser._id
      },
      {
        templateName: 'Marketing Expense',
        templateCode: 'ME001',
        description: 'Pay for marketing and advertising',
        category: 'expense',
        lines: [
          { account: marketingExpense._id, lineType: 'debit' },
          { account: cashAccount._id, lineType: 'credit', isPaymentMethod: true }
        ],
        isActive: true,
        createdBy: adminUser._id
      },
      {
        templateName: 'Office Supplies',
        templateCode: 'OS001',
        description: 'Purchase office supplies',
        category: 'expense',
        lines: [
          { account: suppliesExpense._id, lineType: 'debit' },
          { account: cashAccount._id, lineType: 'credit', isPaymentMethod: true }
        ],
        isActive: true,
        createdBy: adminUser._id
      }
    ];

    const createdTemplates = await TransactionTemplate.insertMany(templates);
    console.log('Created templates:', createdTemplates.length);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Password for all accounts: ECH.Info@12345');
    console.log('\n👥 Admin Accounts:');
    console.log('• admin@excellencecoaching.com (Administrator)');
    console.log('• sauda@excellencecoaching.com (Sauda Usanase)');
    console.log('• john@excellencecoaching.com (John Coach)');
    console.log('• sarah@excellencecoaching.com (Sarah Manager)');
    console.log('\n👥 User Accounts:');
    console.log('• mike@excellencecoaching.com (Mike User)');
    console.log('• lisa@excellencecoaching.com (Lisa Viewer)');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

runSeed().catch(console.error);
