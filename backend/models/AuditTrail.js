const mongoose = require('mongoose');

const auditTrailSchema = new mongoose.Schema({
  // Reference to the affected document
  documentType: {
    type: String,
    required: true,
    enum: ['JournalEntry', 'JournalLine', 'Account', 'Ledger', 'AccountingPeriod']
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // Action information
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'post', 'void', 'approve', 'reject']
  },
  
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Change details
  changes: [{
    field: {
      type: String,
      required: true
    },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changeType: {
      type: String,
      enum: ['create', 'update', 'delete'],
      required: true
    }
  }],
  
  // Additional context
  description: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  
  // Entry-specific fields
  entryNumber: {
    type: String,
    trim: true
  },
  entryType: {
    type: String,
    enum: ['normal', 'adjusting', 'reversing', 'closing']
  },
  reportingPeriod: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
auditTrailSchema.index({ documentType: 1, documentId: 1 });
auditTrailSchema.index({ userId: 1 });
auditTrailSchema.index({ timestamp: -1 });
auditTrailSchema.index({ action: 1 });
auditTrailSchema.index({ entryType: 1 });
auditTrailSchema.index({ reportingPeriod: 1 });

// Static method to create audit entry
auditTrailSchema.statics.createAuditEntry = async function(data) {
  const auditEntry = new this(data);
  await auditEntry.save();
  return auditEntry;
};

// Static method to track journal entry changes
auditTrailSchema.statics.trackJournalEntry = async function(journalEntry, action, userId, changes = []) {
  const auditData = {
    documentType: 'JournalEntry',
    documentId: journalEntry._id,
    action,
    userId,
    username: userId.username || 'Unknown',
    changes,
    entryNumber: journalEntry.entryNumber,
    entryType: journalEntry.entryType,
    reportingPeriod: journalEntry.reportingPeriod,
    description: `${action} journal entry ${journalEntry.entryNumber}`
  };
  
  return await this.createAuditEntry(auditData);
};

// Static method to track approval
auditTrailSchema.statics.trackApproval = async function(journalEntry, userId, approved) {
  const action = approved ? 'approve' : 'reject';
  const auditData = {
    documentType: 'JournalEntry',
    documentId: journalEntry._id,
    action,
    userId,
    username: userId.username || 'Unknown',
    changes: [{
      field: 'status',
      oldValue: journalEntry.status,
      newValue: approved ? 'approved' : 'rejected',
      changeType: 'update'
    }],
    entryNumber: journalEntry.entryNumber,
    entryType: journalEntry.entryType,
    reportingPeriod: journalEntry.reportingPeriod,
    description: `${action} journal entry ${journalEntry.entryNumber}`
  };
  
  return await this.createAuditEntry(auditData);
};

// Virtual to get formatted timestamp
auditTrailSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual to get change summary
auditTrailSchema.virtual('changeSummary').get(function() {
  if (this.changes.length === 0) return 'No changes';
  
  const summaries = this.changes.map(change => {
    if (change.changeType === 'create') {
      return `Created ${change.field}: ${JSON.stringify(change.newValue)}`;
    } else if (change.changeType === 'delete') {
      return `Deleted ${change.field}: ${JSON.stringify(change.oldValue)}`;
    } else {
      return `Updated ${change.field}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`;
    }
  });
  
  return summaries.join(', ');
});

module.exports = mongoose.model('AuditTrail', auditTrailSchema);
