const mongoose = require('mongoose');

const accountingPeriodSchema = new mongoose.Schema({
  period: {
    type: String,
    required: true,
    unique: true,
    trim: true // Format: "YYYY-MM" for monthly, "YYYY" for annual
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'locked'],
    default: 'open'
  },
  description: {
    type: String,
    trim: true
  },
  // Closing information
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  // Financial summary for the period
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  netIncome: {
    type: Number,
    default: 0
  },
  // Adjustments summary
  adjustingEntriesCount: {
    type: Number,
    default: 0
  },
  reversingEntriesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
accountingPeriodSchema.index({ period: 1 });
accountingPeriodSchema.index({ status: 1 });
accountingPeriodSchema.index({ startDate: 1 });
accountingPeriodSchema.index({ endDate: 1 });

// Virtual to check if period is open
accountingPeriodSchema.virtual('isOpen').get(function() {
  return this.status === 'open';
});

// Virtual to check if period allows adjustments
accountingPeriodSchema.virtual('allowsAdjustments').get(function() {
  return this.status === 'open';
});

// Static method to get or create period
accountingPeriodSchema.statics.getOrCreatePeriod = async function(date) {
  const targetDate = new Date(date);
  const periodString = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;
  
  let period = await this.findOne({ period: periodString });
  
  if (!period) {
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    
    period = new this({
      period: periodString,
      startDate,
      endDate,
      description: `${targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    });
    
    await period.save();
  }
  
  return period;
};

// Static method to close period
accountingPeriodSchema.statics.closePeriod = async function(period, userId) {
  const periodDoc = await this.findOne({ period });
  
  if (!periodDoc) {
    throw new Error(`Period ${period} not found`);
  }
  
  if (periodDoc.status === 'closed') {
    throw new Error(`Period ${period} is already closed`);
  }
  
  periodDoc.status = 'closed';
  periodDoc.closedBy = userId;
  periodDoc.closedAt = new Date();
  
  await periodDoc.save();
  return periodDoc;
};

// Static method to reopen period
accountingPeriodSchema.statics.reopenPeriod = async function(period, userId) {
  const periodDoc = await this.findOne({ period });
  
  if (!periodDoc) {
    throw new Error(`Period ${period} not found`);
  }
  
  if (periodDoc.status === 'open') {
    throw new Error(`Period ${period} is already open`);
  }
  
  periodDoc.status = 'open';
  periodDoc.closedBy = null;
  periodDoc.closedAt = null;
  
  await periodDoc.save();
  return periodDoc;
};

module.exports = mongoose.model('AccountingPeriod', accountingPeriodSchema);
