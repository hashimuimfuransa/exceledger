const mongoose = require('mongoose');

const journalLineSchema = new mongoose.Schema({
  journalEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry',
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  description: {
    type: String,
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
  }
}, {
  timestamps: true
});

// Ensure at least one of debit or credit is set
journalLineSchema.pre('save', function(next) {
  if (this.debitAmount === 0 && this.creditAmount === 0) {
    return next(new Error('Either debit or credit amount must be greater than zero'));
  }
  if (this.debitAmount > 0 && this.creditAmount > 0) {
    return next(new Error('Cannot have both debit and credit amounts on the same line'));
  }
  next();
});

module.exports = mongoose.model('JournalLine', journalLineSchema);
