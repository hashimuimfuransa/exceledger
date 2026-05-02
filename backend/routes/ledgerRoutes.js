const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Routes
router.get('/account/:accountId', 
  auth, 
  roleAuth('admin'), 
  ledgerController.getLedgerByAccount
);

router.get('/general', 
  auth, 
  roleAuth('admin'), 
  ledgerController.getGeneralLedger
);

router.get('/balance/:accountId', 
  auth, 
  roleAuth('admin'), 
  ledgerController.getAccountBalance
);

router.post('/entry/:entryId/post', 
  auth, 
  roleAuth('admin'), 
  ledgerController.postJournalEntryToLedger
);

module.exports = router;
