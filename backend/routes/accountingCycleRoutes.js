const express = require('express');
const router = express.Router();
const { 
  createAdjustedEntry, 
  getAdjustingEntries,
  approveAdjustedEntry,
  postAdjustedEntry,
  performYearEndClosing, 
  getClosingEntries, 
  openNewYear,
  createReversingEntry,
  getPeriodEndWorkflow,
  closeAccountingPeriod
} = require('../controllers/accountingCycleController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Adjusted Entries routes
router.post('/adjusted-entries', createAdjustedEntry);
router.get('/adjusted-entries', getAdjustingEntries);
router.post('/adjusted-entries/:entryId/approve', approveAdjustedEntry);
router.post('/adjusted-entries/:entryId/post', postAdjustedEntry);
router.post('/reversing-entries', createReversingEntry);

// Year-End Closing routes
router.post('/year-end-closing', performYearEndClosing);
router.get('/closing-entries', getClosingEntries);

// Period-end workflow routes
router.get('/period-end-workflow', getPeriodEndWorkflow);
router.post('/close-period', closeAccountingPeriod);

// New Year Opening routes
router.post('/open-new-year', openNewYear);

module.exports = router;
