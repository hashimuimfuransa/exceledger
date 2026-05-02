const express = require('express');
const router = express.Router();
const trialBalanceController = require('../controllers/trialBalanceController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Routes
router.get('/', 
  auth, 
  roleAuth('admin'), 
  trialBalanceController.generateTrialBalance
);

router.get('/type/:accountType', 
  auth, 
  roleAuth('admin'), 
  trialBalanceController.getTrialBalanceByType
);

router.get('/summary', 
  auth, 
  roleAuth('admin'), 
  trialBalanceController.getTrialBalanceSummary
);

router.get('/validate', 
  auth, 
  roleAuth('admin'), 
  trialBalanceController.validateTrialBalance
);

module.exports = router;
