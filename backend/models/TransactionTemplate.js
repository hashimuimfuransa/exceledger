const mongoose = require('mongoose');

const transactionTemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  templateCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['revenue', 'expense', 'receivable', 'payable', 'capital', 'refund', 'other'],
    required: true
  },
  lines: [{
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    lineType: {
      type: String,
      enum: ['debit', 'credit'],
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    isAmountFixed: {
      type: Boolean,
      default: false
    },
    fixedAmount: {
      type: Number,
      default: 0
    },
    isPaymentMethod: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionTemplateSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('TransactionTemplate', transactionTemplateSchema);
