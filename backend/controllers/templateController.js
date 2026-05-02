const { TransactionTemplate, Account } = require('../models');
const { validationResult } = require('express-validator');

const createTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { templateName, templateCode, description, category, lines } = req.body;

    // Check if template code already exists
    const existingTemplate = await TransactionTemplate.findOne({ templateCode });
    if (existingTemplate) {
      return res.status(400).json({ message: 'Template code already exists' });
    }

    // Validate lines
    if (!lines || lines.length === 0) {
      return res.status(400).json({ message: 'Template must have at least one line' });
    }

    // Validate each line
    for (const line of lines) {
      if (!line.account) {
        return res.status(400).json({ message: 'Each line must have an account' });
      }

      const account = await Account.findById(line.account);
      if (!account) {
        return res.status(400).json({ message: `Account not found for line: ${line.account}` });
      }

      if (!account.isActive) {
        return res.status(400).json({ message: `Account is inactive: ${account.accountName}` });
      }
    }

    const template = await TransactionTemplate.create({
      templateName,
      templateCode,
      description,
      category,
      lines,
      createdBy: req.user._id
    });

    const populatedTemplate = await TransactionTemplate.findById(template._id)
      .populate('lines.account', 'accountCode accountName accountType')
      .populate('createdBy', 'username fullName');

    res.status(201).json({
      message: 'Transaction template created successfully',
      template: populatedTemplate
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Server error creating template' });
  }
};

const getAllTemplates = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const templates = await TransactionTemplate.find(filter)
      .populate('lines.account', 'accountCode accountName accountType')
      .populate('createdBy', 'username fullName')
      .sort({ templateName: 1 });

    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error fetching templates' });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const template = await TransactionTemplate.findById(req.params.id)
      .populate('lines.account', 'accountCode accountName accountType normalBalance')
      .populate('createdBy', 'username fullName');

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Server error fetching template' });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const template = await TransactionTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const { templateName, templateCode, description, category, lines, isActive } = req.body;

    // Check if new template code conflicts with existing
    if (templateCode && templateCode !== template.templateCode) {
      const existingTemplate = await TransactionTemplate.findOne({ templateCode });
      if (existingTemplate) {
        return res.status(400).json({ message: 'Template code already exists' });
      }
    }

    // Validate lines if provided
    if (lines && lines.length > 0) {
      for (const line of lines) {
        if (!line.account) {
          return res.status(400).json({ message: 'Each line must have an account' });
        }

        const account = await Account.findById(line.account);
        if (!account) {
          return res.status(400).json({ message: `Account not found for line: ${line.account}` });
        }

        if (!account.isActive) {
          return res.status(400).json({ message: `Account is inactive: ${account.accountName}` });
        }
      }
    }

    // Update allowed fields
    if (templateName !== undefined) template.templateName = templateName;
    if (templateCode !== undefined) template.templateCode = templateCode;
    if (description !== undefined) template.description = description;
    if (category !== undefined) template.category = category;
    if (lines !== undefined) template.lines = lines;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();

    const populatedTemplate = await TransactionTemplate.findById(template._id)
      .populate('lines.account', 'accountCode accountName accountType')
      .populate('createdBy', 'username fullName');

    res.json({
      message: 'Template updated successfully',
      template: populatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Server error updating template' });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const template = await TransactionTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if template has been used in journal entries
    const { JournalEntry } = require('../models');
    const usedInEntry = await JournalEntry.findOne({ templateUsed: template._id });
    if (usedInEntry) {
      return res.status(400).json({ 
        message: 'Cannot delete template that has been used in journal entries' 
      });
    }

    await TransactionTemplate.findByIdAndDelete(req.params.id);

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Server error deleting template' });
  }
};

const getTemplatesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!['revenue', 'expense', 'receivable', 'payable', 'capital', 'refund', 'other'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const templates = await TransactionTemplate.find({ 
      category, 
      isActive: true 
    })
      .populate('lines.account', 'accountCode accountName accountType normalBalance')
      .sort({ templateName: 1 });

    res.json({ templates });
  } catch (error) {
    console.error('Get templates by category error:', error);
    res.status(500).json({ message: 'Server error fetching templates by category' });
  }
};

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getTemplatesByCategory
};
