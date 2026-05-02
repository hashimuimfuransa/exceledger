const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
    required: true
  },
  subType: {
    type: String,
    enum: [
      // Assets
      'current_asset', 'fixed_asset', 'other_asset',
      // Liabilities
      'current_liability', 'long_term_liability', 'other_liability',
      // Equity
      'owner_equity', 'retained_earnings',
      // Revenue
      'operating_revenue', 'other_revenue',
      // Expenses
      'operating_expense', 'other_expense'
    ]
  },
  normalBalance: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
accountSchema.index({ accountType: 1, isActive: 1 });

module.exports = mongoose.model('Account', accountSchema);
