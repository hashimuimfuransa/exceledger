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
  entryType: {
    type: String,
    enum: ['normal', 'adjusting', 'reversing', 'closing'],
    default: 'normal'
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
  },
  // Enhanced fields for adjusting entries
  adjustmentType: {
    type: String,
    enum: ['accrual', 'deferral', 'correcting', 'year_end', 'reversal'],
    default: null
  },
  autoCalculated: {
    type: Boolean,
    default: false
  },
  reversesEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry',
    default: null
  },
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry',
    default: null
  },
  // Period control fields
  reportingPeriod: {
    type: String,
    required: false,
    trim: true // Format: "YYYY-MM" for monthly, "YYYY" for annual
  },
  periodStartDate: {
    type: Date,
    required: false
  },
  periodEndDate: {
    type: Date,
    required: false
  },
  // Approval workflow
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  // Auto-reverse functionality
  autoReverse: {
    type: Boolean,
    default: false
  },
  reverseDate: {
    type: Date,
    default: null
  },
  reversed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
journalEntrySchema.index({ entryDate: -1 });
journalEntrySchema.index({ status: 1 });
journalEntrySchema.index({ createdBy: 1 });
journalEntrySchema.index({ entryType: 1 });
journalEntrySchema.index({ adjustmentType: 1 });
journalEntrySchema.index({ reversesEntry: 1 });
journalEntrySchema.index({ reversedBy: 1 });
journalEntrySchema.index({ reportingPeriod: 1 });
journalEntrySchema.index({ periodStartDate: 1 });
journalEntrySchema.index({ periodEndDate: 1 });
journalEntrySchema.index({ approvedBy: 1 });
journalEntrySchema.index({ autoReverse: 1 });

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
  
  // Set reporting period if not provided (only for new entries)
  if (!this.reportingPeriod && this.entryDate && this.isNew) {
    const date = new Date(this.entryDate);
    this.reportingPeriod = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  
  // Set period dates if not provided (only for new entries)
  if (!this.periodStartDate && this.reportingPeriod && this.isNew) {
    const [year, month] = this.reportingPeriod.split('-');
    this.periodStartDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    this.periodEndDate = new Date(parseInt(year), parseInt(month), 0);
  }
  
  next();
});

// Virtual to check if entry can be edited
journalEntrySchema.virtual('isEditable').get(function() {
  return this.status === 'draft';
});

// Virtual to check if entry is in closed period
journalEntrySchema.virtual('isInClosedPeriod', {
  ref: 'AccountingPeriod',
  localField: 'reportingPeriod',
  foreignField: 'period',
  justOne: true
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
