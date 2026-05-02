const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'Excellence Coaching Hub'
  },
  taxRate: {
    type: Number,
    default: 0.30, // 30% corporate tax rate for Rwanda
    min: 0,
    max: 1
  },
  interestRate: {
    type: Number,
    default: 0.15, // 15% annual interest rate
    min: 0,
    max: 1
  },
  fiscalYearEnd: {
    type: String,
    default: '12-31', // December 31st
    match: /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
  },
  currency: {
    type: String,
    default: 'Frw',
    enum: ['Frw', 'USD', 'EUR', 'GBP']
  },
  address: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

// Static method to get settings
Settings.getSettings = async function() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
    await settings.save();
  }
  return settings;
};

// Static method to update settings
Settings.updateSettings = async function(updateData) {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings(updateData);
  } else {
    Object.assign(settings, updateData);
  }
  await settings.save();
  return settings;
};

module.exports = Settings;
