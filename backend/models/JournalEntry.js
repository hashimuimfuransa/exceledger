const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  entryNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  entryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  lines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalLine'
  }],
  totalDebit: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCredit: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'posted', 'voided'],
    default: 'draft'
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  templateUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransactionTemplate',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
journalEntrySchema.index({ entryDate: -1 });
journalEntrySchema.index({ status: 1 });
journalEntrySchema.index({ createdBy: 1 });

// Virtual to check if entry is balanced
journalEntrySchema.virtual('isBalanced').get(function() {
  return Math.abs(this.totalDebit - this.totalCredit) < 0.01;
});

// Ensure entry is balanced before posting
journalEntrySchema.pre('save', function(next) {
  if (this.status === 'posted' && !this.isBalanced) {
    return next(new Error('Cannot post unbalanced journal entry'));
  }
  if (this.status === 'posted' && !this.postedAt) {
    this.postedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
