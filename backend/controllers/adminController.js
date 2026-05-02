const { JournalEntry, JournalLine, Ledger, Account, User, AuditTrail, AccountingPeriod } = require('../models');

const permanentDeleteAllData = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('Starting permanent deletion of all transaction data...');

    // Start a session for transaction-like behavior
    const session = await require('mongoose').startSession();
    
    // Declare variables outside transaction scope
    let deletedLines, deletedEntries, deletedLedgers, deletedAudits;
    
    try {
      await session.withTransaction(async () => {
        // Delete all journal lines first (due to references)
        deletedLines = await JournalLine.deleteMany({}, { session });
        console.log(`Deleted ${deletedLines.deletedCount} journal lines`);

        // Delete all journal entries
        deletedEntries = await JournalEntry.deleteMany({}, { session });
        console.log(`Deleted ${deletedEntries.deletedCount} journal entries`);

        // Delete all ledger entries
        deletedLedgers = await Ledger.deleteMany({}, { session });
        console.log(`Deleted ${deletedLedgers.deletedCount} ledger entries`);

        // Delete all audit trails
        deletedAudits = await AuditTrail.deleteMany({}, { session });
        console.log(`Deleted ${deletedAudits.deletedCount} audit trails`);

        // Reset accounting periods (keep the structure but clear data)
        await AccountingPeriod.updateMany(
          {}, 
          { 
            isClosed: false,
            closedAt: null,
            closedBy: null,
            openingBalances: {},
            closingBalances: {},
            adjustments: [],
            netIncome: 0
          },
          { session }
        );
        console.log('Reset all accounting periods');

        // Reset account balances to zero
        await Account.updateMany(
          {},
          { $set: { currentBalance: 0 } },
          { session }
        );
        console.log('Reset all account balances to zero');
      });

      console.log('Permanent deletion completed successfully');

      res.json({
        message: 'All transaction data has been permanently deleted',
        deletedItems: {
          journalLines: deletedLines.deletedCount,
          journalEntries: deletedEntries.deletedCount,
          ledgerEntries: deletedLedgers.deletedCount,
          auditTrails: deletedAudits.deletedCount
        }
      });

    } catch (transactionError) {
      console.error('Transaction error during deletion:', transactionError);
      throw transactionError;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Permanent deletion error:', error);
    res.status(500).json({ 
      message: 'Error during permanent deletion',
      error: error.message 
    });
  }
};

const getSystemStats = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('=== ADMIN STATS DEBUG ===');
    console.log('Fetching system statistics...');
    console.log('Database name:', require('mongoose').connection.name);
    console.log('Database state:', require('mongoose').connection.readyState);
    
    // Check if models exist
    console.log('Available models:');
    console.log('JournalEntry model exists:', !!JournalEntry);
    console.log('JournalLine model exists:', !!JournalLine);
    console.log('Ledger model exists:', !!Ledger);
    console.log('AuditTrail model exists:', !!AuditTrail);
    console.log('Account model exists:', !!Account);
    console.log('User model exists:', !!User);

    const [
      journalEntryCount,
      journalLineCount,
      ledgerCount,
      auditCount,
      accountCount,
      userCount
    ] = await Promise.all([
      JournalEntry.countDocuments().catch(err => {
        console.error('JournalEntry count error:', err);
        return 0;
      }),
      JournalLine.countDocuments().catch(err => {
        console.error('JournalLine count error:', err);
        return 0;
      }),
      Ledger.countDocuments().catch(err => {
        console.error('Ledger count error:', err);
        return 0;
      }),
      AuditTrail.countDocuments().catch(err => {
        console.error('AuditTrail count error:', err);
        return 0;
      }),
      Account.countDocuments().catch(err => {
        console.error('Account count error:', err);
        return 0;
      }),
      User.countDocuments().catch(err => {
        console.error('User count error:', err);
        return 0;
      })
    ]);

    console.log('Database counts:');
    console.log('Journal Entries:', journalEntryCount);
    console.log('Journal Lines:', journalLineCount);
    console.log('Ledger Entries:', ledgerCount);
    console.log('Audit Trails:', auditCount);
    console.log('Accounts:', accountCount);
    console.log('Users:', userCount);

    const statsData = {
      stats: {
        journalEntries: journalEntryCount,
        journalLines: journalLineCount,
        ledgerEntries: ledgerCount,
        auditTrails: auditCount,
        accounts: accountCount,
        users: userCount
      }
    };

    console.log('Response data:', JSON.stringify(statsData, null, 2));
    console.log('=== END ADMIN STATS DEBUG ===');

    res.json(statsData);

  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ message: 'Error retrieving system statistics' });
  }
};

module.exports = {
  permanentDeleteAllData,
  getSystemStats
};
