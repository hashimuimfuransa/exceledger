const express = require('express');
const router = express.Router();
const financialStatementsController = require('../controllers/financialStatementsController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Routes
router.get('/income-statement', 
  auth, 
  roleAuth('admin'), 
  financialStatementsController.getIncomeStatement
);

router.get('/balance-sheet', 
  auth, 
  roleAuth('admin'), 
  financialStatementsController.getBalanceSheet
);

router.get('/cash-flow', 
  auth, 
  roleAuth('admin'), 
  financialStatementsController.getCashFlowStatement
);

router.get('/general-journal', 
  auth, 
  roleAuth('admin'), 
  financialStatementsController.getGeneralJournal
);

router.get('/summary', 
  auth, 
  roleAuth('admin'), 
  financialStatementsController.getFinancialSummary
);

module.exports = router;
