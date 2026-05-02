const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const accountController = require('../controllers/accountController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Validation rules
const createAccountValidation = [
  body('accountCode')
    .trim()
    .notEmpty()
    .withMessage('Account code is required'),
  body('accountName')
    .trim()
    .notEmpty()
    .withMessage('Account name is required'),
  body('accountType')
    .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
    .withMessage('Invalid account type'),
  body('normalBalance')
    .isIn(['debit', 'credit'])
    .withMessage('Normal balance must be debit or credit')
];

const updateAccountValidation = [
  body('accountName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Account name cannot be empty'),
  body('accountType')
    .optional()
    .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
    .withMessage('Invalid account type'),
  body('normalBalance')
    .optional()
    .isIn(['debit', 'credit'])
    .withMessage('Normal balance must be debit or credit')
];

// Routes - All account management routes require admin role
router.post('/', 
  auth, 
  roleAuth('admin'), 
  createAccountValidation, 
  accountController.createAccount
);

router.get('/', 
  auth, 
  roleAuth('admin'), 
  accountController.getAllAccounts
);

router.get('/type/:type', 
  auth, 
  roleAuth('admin'), 
  accountController.getAccountsByType
);

router.get('/:id', 
  auth, 
  roleAuth('admin'), 
  accountController.getAccountById
);

router.put('/:id', 
  auth, 
  roleAuth('admin'), 
  updateAccountValidation, 
  accountController.updateAccount
);

router.delete('/:id', 
  auth, 
  roleAuth('admin'), 
  accountController.deleteAccount
);

module.exports = router;
