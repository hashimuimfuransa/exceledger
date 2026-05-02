const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Validation rules
const createTemplateValidation = [
  body('templateName')
    .trim()
    .notEmpty()
    .withMessage('Template name is required'),
  body('templateCode')
    .trim()
    .notEmpty()
    .withMessage('Template code is required'),
  body('category')
    .isIn(['revenue', 'expense', 'receivable', 'payable', 'capital', 'refund', 'other'])
    .withMessage('Invalid category'),
  body('lines')
    .isArray({ min: 1 })
    .withMessage('Template must have at least one line'),
  body('lines.*.account')
    .notEmpty()
    .withMessage('Each line must have an account'),
  body('lines.*.lineType')
    .isIn(['debit', 'credit'])
    .withMessage('Line type must be debit or credit')
];

const updateTemplateValidation = [
  body('templateName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Template name cannot be empty'),
  body('templateCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Template code cannot be empty'),
  body('category')
    .optional()
    .isIn(['revenue', 'expense', 'receivable', 'payable', 'capital', 'refund', 'other'])
    .withMessage('Invalid category'),
  body('lines')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Template must have at least one line')
];

// Routes - All template routes require admin role
router.post('/', 
  auth, 
  roleAuth('admin'), 
  createTemplateValidation, 
  templateController.createTemplate
);

router.get('/', 
  auth, 
  roleAuth('admin'), 
  templateController.getAllTemplates
);

router.get('/category/:category', 
  auth, 
  roleAuth('admin'), 
  templateController.getTemplatesByCategory
);

router.get('/:id', 
  auth, 
  roleAuth('admin'), 
  templateController.getTemplateById
);

router.put('/:id', 
  auth, 
  roleAuth('admin'), 
  updateTemplateValidation, 
  templateController.updateTemplate
);

router.delete('/:id', 
  auth, 
  roleAuth('admin'), 
  templateController.deleteTemplate
);

module.exports = router;
