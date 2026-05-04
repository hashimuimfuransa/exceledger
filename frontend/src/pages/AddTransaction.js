import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { templatesAPI, journalAPI, accountsAPI } from '../services/api';
import { Add, Remove, AccountBalance, Upload, AttachFile } from '@mui/icons-material';

const AddTransaction = () => {
  const theme = useTheme();
  const [templates, setTemplates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [journalLines, setJournalLines] = useState([
    { accountId: '', lineType: 'debit', amount: '', description: '' },
    { accountId: '', lineType: 'credit', amount: '', description: '' }
  ]);
  const [transactionData, setTransactionData] = useState({
    entryDate: new Date(),
    description: '',
    referenceNumber: '',
    status: 'draft',
  });
  const [paymentProof, setPaymentProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesResponse, accountsResponse] = await Promise.all([
          templatesAPI.getAll({ isActive: true }),
          accountsAPI.getAll({ isActive: true })
        ]);
        setTemplates(templatesResponse.data.templates || []);
        setAccounts(accountsResponse.data.accounts || []);
      } catch (err) {
        setError('Failed to load data');
      }
    };

    fetchData();
  }, []);

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      // Apply template data
      setTransactionData(prev => ({
        ...prev,
        description: template.description || prev.description,
        referenceNumber: template.referenceNumber || prev.referenceNumber,
      }));
      
      // Apply template journal lines
      if (template.journalLines && template.journalLines.length > 0) {
        setJournalLines(template.journalLines.map(line => ({
          accountId: line.accountId || '',
          lineType: line.lineType || 'debit',
          amount: line.amount || '',
          description: line.description || '',
        })));
      }
      
      setSuccess(`Template "${template.templateName}" applied successfully`);
      setTimeout(() => setSuccess(''), 3000);
    }
    setError('');
  };

  const handleInputChange = (field) => (event) => {
    setTransactionData({
      ...transactionData,
      [field]: event.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleJournalLineChange = (index, field) => (event) => {
    const newLines = [...journalLines];
    newLines[index] = {
      ...newLines[index],
      [field]: field === 'amount' ? parseFloat(event.target.value) || '' : event.target.value,
    };
    setJournalLines(newLines);
    setError('');
    setSuccess('');
  };

  const addJournalLine = () => {
    setJournalLines([
      ...journalLines,
      { accountId: '', lineType: 'debit', amount: '', description: '' }
    ]);
  };

  const removeJournalLine = (index) => {
    if (journalLines.length > 2) {
      const newLines = journalLines.filter((_, i) => i !== index);
      setJournalLines(newLines);
    }
  };

  const calculateTotals = () => {
    const debitTotal = journalLines
      .filter(line => line.lineType === 'debit')
      .reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
    const creditTotal = journalLines
      .filter(line => line.lineType === 'credit')
      .reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
    return { debitTotal, creditTotal, balanced: debitTotal === creditTotal };
  };

  const handleDateChange = (date) => {
    setTransactionData({
      ...transactionData,
      entryDate: date,
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only images and PDFs are allowed.');
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      setPaymentProof(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { debitTotal, creditTotal, balanced } = calculateTotals();
    
    if (!transactionData.description) {
      setError('Description is required');
      return;
    }

    if (!balanced) {
      setError(`Journal entries must balance. Debit: Frw ${debitTotal.toFixed(2)}, Credit: Frw ${creditTotal.toFixed(2)}`);
      return;
    }

    const validLines = journalLines.filter(line => line.accountId && line.amount);
    if (validLines.length < 2) {
      setError('At least two valid journal lines are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Use FormData if there's a file, otherwise use regular JSON
      if (paymentProof) {
        const formData = new FormData();
        formData.append('entryDate', transactionData.entryDate.toISOString().split('T')[0]);
        formData.append('description', transactionData.description);
        formData.append('referenceNumber', transactionData.referenceNumber);
        formData.append('status', transactionData.status);
        formData.append('paymentProof', paymentProof);
        
        validLines.forEach((line, index) => {
          formData.append(`lines[${index}][account]`, line.accountId);
          formData.append(`lines[${index}][debitAmount]`, line.lineType === 'debit' ? parseFloat(line.amount) : 0);
          formData.append(`lines[${index}][creditAmount]`, line.lineType === 'credit' ? parseFloat(line.amount) : 0);
          formData.append(`lines[${index}][description]`, line.description);
        });

        await journalAPI.createWithFile(formData);
      } else {
        const payload = {
          entryDate: transactionData.entryDate.toISOString().split('T')[0],
          description: transactionData.description,
          referenceNumber: transactionData.referenceNumber,
          status: transactionData.status,
          lines: validLines.map(line => ({
            account: line.accountId,
            debitAmount: line.lineType === 'debit' ? parseFloat(line.amount) : 0,
            creditAmount: line.lineType === 'credit' ? parseFloat(line.amount) : 0,
            description: line.description,
          })),
        };

        await journalAPI.create(payload);
      }
      
      setSuccess('Transaction created successfully!');
      setJournalLines([
        { accountId: '', lineType: 'debit', amount: '', description: '' },
        { accountId: '', lineType: 'credit', amount: '', description: '' }
      ]);
      setTransactionData({
        entryDate: new Date(),
        description: '',
        referenceNumber: '',
        status: 'draft',
      });
      setPaymentProof(null);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplateData = templates.find(t => t._id === selectedTemplate);
  const { debitTotal, creditTotal, balanced } = calculateTotals();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Add Journal Entry
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        ) : null}

        {success ? (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        ) : null}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Transaction Date"
                        value={transactionData.entryDate}
                        onChange={handleDateChange}
                        slots={{ textField: TextField }}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Reference Number"
                        value={transactionData.referenceNumber}
                        onChange={handleInputChange('referenceNumber')}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={transactionData.description}
                        onChange={handleInputChange('description')}
                        required
                        multiline
                        rows={2}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={transactionData.status}
                          onChange={handleInputChange('status')}
                          label="Status"
                        >
                          <MenuItem value="draft">Draft</MenuItem>
                          <MenuItem value="posted">Posted</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 3,
                          border: '2px dashed',
                          borderColor: paymentProof ? 'success.main' : alpha(theme.palette.divider, 0.5),
                          borderRadius: 2,
                          textAlign: 'center',
                          bgcolor: paymentProof ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.background.default, 0.5),
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: paymentProof ? 'success.main' : 'primary.main',
                            bgcolor: paymentProof ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                        onClick={() => document.getElementById('payment-proof-input').click()}
                      >
                        <input
                          id="payment-proof-input"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        {paymentProof ? (
                          <Box>
                            <AttachFile color="success" sx={{ fontSize: 48, mb: 1 }} />
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {paymentProof.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <Upload sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }} />
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              Upload Payment Proof
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Click to select a file (Images or PDF, max 10MB)
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Journal Lines
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={addJournalLine}
                          size="small"
                        >
                          Add Line
                        </Button>
                      </Box>

                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                      }}>
                        {journalLines.map((line, index) => (
                          <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < journalLines.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.2)}` : 'none' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Line {index + 1}
                              </Typography>
                              {journalLines.length > 2 && (
                                <IconButton
                                  size="small"
                                  onClick={() => removeJournalLine(index)}
                                  color="error"
                                >
                                  <Remove />
                                </IconButton>
                              )}
                            </Box>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Account</InputLabel>
                                  <Select
                                    value={line.accountId}
                                    onChange={handleJournalLineChange(index, 'accountId')}
                                    label="Account"
                                  >
                                    <MenuItem value="">Select account...</MenuItem>
                                    {accounts.map((account) => (
                                      <MenuItem key={account._id} value={account._id}>
                                        {account.accountCode} - {account.accountName}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Type</InputLabel>
                                  <Select
                                    value={line.lineType}
                                    onChange={handleJournalLineChange(index, 'lineType')}
                                    label="Type"
                                  >
                                    <MenuItem value="debit">Debit</MenuItem>
                                    <MenuItem value="credit">Credit</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  fullWidth
                                  label="Amount"
                                  type="number"
                                  value={line.amount}
                                  onChange={handleJournalLineChange(index, 'amount')}
                                  size="small"
                                  inputProps={{ min: 0, step: 0.01 }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <Chip
                                  label={line.lineType === 'debit' ? 'DR' : 'CR'}
                                  color={line.lineType === 'debit' ? 'primary' : 'secondary'}
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        ))}
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: balanced ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                        border: `1px solid ${balanced ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.error.main, 0.3)}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Total Debit: <strong>Frw {debitTotal.toFixed(2)}</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Credit: <strong>Frw {creditTotal.toFixed(2)}</strong>
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: balanced ? 'success.main' : 'error.main'
                          }}
                        >
                          {balanced ? '✓ Balanced' : '⚠ Not Balanced'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={loading || !balanced}
                          startIcon={loading ? <CircularProgress size={20} /> : null}
                          sx={{ 
                            borderRadius: 2.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1.5
                          }}
                        >
                          {loading ? 'Creating...' : 'Create Journal Entry'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setJournalLines([
                              { accountId: '', lineType: 'debit', amount: '', description: '' },
                              { accountId: '', lineType: 'credit', amount: '', description: '' }
                            ]);
                            setTransactionData({
                              entryDate: new Date(),
                              description: '',
                              referenceNumber: '',
                              status: 'draft',
                            });
                            setError('');
                            setSuccess('');
                          }}
                          sx={{ 
                            borderRadius: 2.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1.5
                          }}
                        >
                          Clear
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Quick Templates
                </Typography>
                
                {templates.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No templates available
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Revenue Templates */}
                    {templates.filter(t => t.category === 'revenue').length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
                          💰 Revenue
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {templates.filter(t => t.category === 'revenue').slice(0, 3).map((template) => (
                            <Button
                              key={template._id}
                              variant={selectedTemplate === template._id ? "contained" : "outlined"}
                              size="small"
                              onClick={() => handleTemplateChange(template._id)}
                              sx={{ 
                                justifyContent: 'flex-start', 
                                borderRadius: 2,
                                textTransform: 'none',
                                borderColor: 'primary.main',
                                '&:hover': {
                                  borderColor: 'primary.dark',
                                }
                              }}
                            >
                              {template.templateName}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {/* Expense Templates */}
                    {templates.filter(t => t.category === 'expense').length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="error" sx={{ mb: 1, fontWeight: 600 }}>
                          💸 Expenses
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {templates.filter(t => t.category === 'expense').slice(0, 3).map((template) => (
                            <Button
                              key={template._id}
                              variant={selectedTemplate === template._id ? "contained" : "outlined"}
                              size="small"
                              onClick={() => handleTemplateChange(template._id)}
                              sx={{ 
                                justifyContent: 'flex-start', 
                                borderRadius: 2,
                                textTransform: 'none',
                                borderColor: 'error.main',
                                '&:hover': {
                                  borderColor: 'error.dark',
                                }
                              }}
                            >
                              {template.templateName}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {/* Other Templates */}
                    {templates.filter(t => !['revenue', 'expense'].includes(t.category)).length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                          📋 Other
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {templates.filter(t => !['revenue', 'expense'].includes(t.category)).slice(0, 3).map((template) => (
                            <Button
                              key={template._id}
                              variant={selectedTemplate === template._id ? "contained" : "outlined"}
                              size="small"
                              onClick={() => handleTemplateChange(template._id)}
                              sx={{ 
                                justifyContent: 'flex-start', 
                                borderRadius: 2,
                                textTransform: 'none'
                              }}
                            >
                              {template.templateName}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <Button
                      variant="text"
                      size="small"
                      sx={{ alignSelf: 'center', mt: 1 }}
                      onClick={() => console.log('Navigate to templates management')}
                    >
                      View All Templates →
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default AddTransaction;
