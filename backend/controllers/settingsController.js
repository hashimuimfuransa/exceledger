const Settings = require('../models/Settings');

const getCompanySettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error fetching settings' });
  }
};

const updateCompanySettings = async (req, res) => {
  try {
    const { companyName, taxRate, interestRate, fiscalYearEnd, currency, address, phone, email } = req.body;
    
    console.log('Settings update request body:', { companyName, taxRate, interestRate, fiscalYearEnd, currency, address, phone, email });
    
    const settingsData = {};
    if (companyName !== undefined) settingsData.companyName = companyName;
    
    // Parse tax rate - handle both decimal and percentage string formats
    if (taxRate !== undefined) {
      if (typeof taxRate === 'string') {
        const cleanTaxRate = taxRate.replace('%', '').trim();
        const parsedTaxRate = parseFloat(cleanTaxRate) / 100;
        settingsData.taxRate = isNaN(parsedTaxRate) ? 0.30 : parsedTaxRate;
      } else {
        settingsData.taxRate = taxRate;
      }
    }
    
    // Parse interest rate - handle both decimal and percentage string formats
    if (interestRate !== undefined) {
      if (typeof interestRate === 'string') {
        const cleanInterestRate = interestRate.replace('%', '').trim();
        const parsedInterestRate = parseFloat(cleanInterestRate) / 100;
        settingsData.interestRate = isNaN(parsedInterestRate) ? 0.15 : parsedInterestRate;
      } else {
        settingsData.interestRate = interestRate;
      }
    }
    
    if (fiscalYearEnd !== undefined) settingsData.fiscalYearEnd = fiscalYearEnd;
    if (currency !== undefined) settingsData.currency = currency;
    if (address !== undefined) settingsData.address = address;
    if (phone !== undefined) settingsData.phone = phone;
    if (email !== undefined) settingsData.email = email;

    console.log('Parsed settings data before save:', settingsData);

    const settings = await Settings.updateSettings(settingsData);
    console.log('Settings after save:', settings);
    
    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error updating settings' });
  }
};

module.exports = {
  getCompanySettings,
  updateCompanySettings
};
