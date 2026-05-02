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
  alpha,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ArrowBack, Save, Remove } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { journalAPI, accountsAPI } from '../services/api';

const EditTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [journalLines, setJournalLines] = useState([]);
  const [transactionData, setTransactionData] = useState({
    entryDate: new Date(),
    description: '',
    referenceNumber: '',
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transactionResponse, accountsResponse] = await Promise.all([
          journalAPI.getById(id),
          accountsAPI.getAll({ isActive: true })
        ]);
        
        const transaction = transactionResponse.data.entry;
        setTransactionData({
          entryDate: new Date(transaction.entryDate),
          description: transaction.description,
          referenceNumber: transaction.referenceNumber || '',
          status: transaction.status,
        });
        
        setJournalLines(transaction.lines.map(line => ({
          accountId: line.account._id || line.account,
          lineType: line.debitAmount > 0 ? 'debit' : 'credit',
          amount: line.debitAmount > 0 ? line.debitAmount : line.creditAmount,
          description: line.description || '',
        })));
        
        setAccounts(accountsResponse.data.accounts || []);
        setInitialLoad(false);
      } catch (err) {
        setError('Failed to load transaction data');
        console.error('Edit transaction error:', err);
        setInitialLoad(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

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

      await journalAPI.update(id, payload);
      
      setSuccess('Transaction updated successfully!');
      setTimeout(() => {
        navigate(`/transactions/${id}`);
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const { debitTotal, creditTotal, balanced } = calculateTotals();

  if (initialLoad) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/transactions/${id}`)}
            sx={{ mr: 2 }}
          >
            Back to Transaction
          </Button>
          <Typography variant="h4">
            Edit Journal Entry
          </Typography>
        </Box>

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
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Journal Lines
                  </Typography>

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
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: line.lineType === 'debit' ? 'primary.main' : 'secondary.main',
                                display: 'flex',
                                alignItems: 'center',
                                height: '100%'
                              }}
                            >
                              {line.lineType === 'debit' ? 'DR' : 'CR'}
                            </Typography>
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
                      startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                      sx={{ 
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5
                      }}
                    >
                      {loading ? 'Updating...' : 'Update Journal Entry'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/transactions/${id}`)}
                      sx={{ 
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default EditTransaction;
