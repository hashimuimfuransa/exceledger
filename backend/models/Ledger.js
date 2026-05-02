const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  journalEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry',
    required: true
  },
  journalLine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalLine',
    required: true
  },
  entryDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  debitAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  creditAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    required: true
  },
  runningBalance: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for account ledger queries
ledgerSchema.index({ account: 1, entryDate: 1 });
ledgerSchema.index({ journalEntry: 1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
