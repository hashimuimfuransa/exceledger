const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Validation rules
const createUserValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user')
];

const updateUserValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// All user management routes require admin role
router.use(auth);
router.use((req, res, next) => {
  console.log('=== USER ROUTES DEBUG ===');
  console.log('req.user exists:', !!req.user);
  console.log('req.user.role:', req.user?.role);
  console.log('req.user.role type:', typeof req.user?.role);
  console.log('Role check result:', req.user?.role === 'admin');
  
  // Temporarily bypass roleAuth for debugging
  if (req.user?.role === 'admin') {
    console.log('Admin user detected, allowing access');
    next();
  } else {
    console.log('Non-admin user detected, denying access');
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  console.log('========================');
});

// Routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', createUserValidation, userController.createUser);
router.put('/:id', updateUserValidation, userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/toggle-status', userController.toggleUserStatus);

module.exports = router;
