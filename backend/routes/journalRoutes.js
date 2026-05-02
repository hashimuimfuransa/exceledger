const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const journalController = require('../controllers/journalController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Validation rules
const createJournalEntryValidation = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('entryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(['draft', 'posted'])
    .withMessage('Status must be draft or posted')
];

const updateJournalEntryValidation = [
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('entryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(['draft', 'posted'])
    .withMessage('Status must be draft or posted')
];

// Routes - All journal entry routes require admin role
router.post('/', 
  auth, 
  roleAuth('admin'), 
  createJournalEntryValidation, 
  journalController.createJournalEntry
);

router.get('/', 
  auth, 
  roleAuth('admin'), 
  journalController.getAllJournalEntries
);

router.get('/:id', 
  auth, 
  roleAuth('admin'), 
  journalController.getJournalEntryById
);

router.put('/:id', 
  auth, 
  roleAuth('admin'), 
  updateJournalEntryValidation, 
  journalController.updateJournalEntry
);

router.delete('/:id', 
  auth, 
  roleAuth('admin'), 
  journalController.deleteJournalEntry
);

router.post('/:id/post', 
  auth, 
  roleAuth('admin'), 
  journalController.postJournalEntry
);

module.exports = router;
