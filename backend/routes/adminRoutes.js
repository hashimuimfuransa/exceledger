const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { permanentDeleteAllData, getSystemStats } = require('../controllers/adminController');

// Apply authentication middleware to all routes
router.use(auth);

// Get system statistics (admin only)
router.get('/stats', getSystemStats);

// Permanent deletion of all transaction data (admin only)
router.delete('/delete-all', permanentDeleteAllData);

module.exports = router;
