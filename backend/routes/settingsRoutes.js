const express = require('express');
const router = express.Router();
const { getCompanySettings, updateCompanySettings } = require('../controllers/settingsController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Settings routes
router.get('/', getCompanySettings);
router.put('/', updateCompanySettings);

module.exports = router;
