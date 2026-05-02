import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Cancel,
  Search,
  FilterList,
  ArrowDropDown,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  PostAdd,
  ExpandMore,
  CalendarToday,
  Description,
  AccountBalance,
  TrendingUp,
  Info,
  CheckCircle,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingCycleAPI, accountsAPI } from '../services/api';

const formatCurrency = (amount) => {
  return `Frw ${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const AdjustedEntries = () => {
  const theme = useTheme();
  const [adjustedEntries, setAdjustedEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });
  const [formData, setFormData] = useState({
    description: '',
    adjustmentDate: new Date(),
    adjustmentType: 'year_end',
    lines: [],
    autoCalculate: false,
    referenceTransactions: []
  });

  useEffect(() => {
    fetchAdjustedEntries();
    fetchAccounts();
  }, [dateRange]);

  const fetchAdjustedEntries = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await accountingCycleAPI.getAdjustedEntries({
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
      });
      
      setAdjustedEntries(response.data.adjustedEntries);
    } catch (err) {
      setError('Failed to load adjusted entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await accountsAPI.getAll();
      // Backend returns { accounts: [...] }
      const accountsData = response.data?.accounts || [];
      const accountsArray = Array.isArray(accountsData) ? accountsData : [];
      setAccounts(accountsArray);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setAccounts([]); // Set to empty array on error
    }
  };

  const handleCreateAdjustedEntry = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validation: Minimum 2 lines required
      if (formData.lines.length < 2) {
        setError('Journal entry must have at least 2 lines');
        return;
      }
      
      // Validation: Each line must have an account
      const missingAccount = formData.lines.find(line => !line.accountId);
      if (missingAccount) {
        setError('Each line must have an account selected');
        return;
      }
      
      // Validation: Total debits must equal total credits
      const totalDebits = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
      const totalCredits = formData.lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
      
      // Debug logging
      console.log('Balance Validation Debug:');
      console.log('Lines:', formData.lines);
      console.log('Total Debits:', totalDebits);
      console.log('Total Credits:', totalCredits);
      console.log('Difference:', Math.abs(totalDebits - totalCredits));
      console.log('Line details:', formData.lines.map((line, i) => ({
        line: i + 1,
        debit: parseFloat(line.debitAmount) || 0,
        credit: parseFloat(line.creditAmount) || 0,
        debitStr: line.debitAmount,
        creditStr: line.creditAmount
      })));
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        setError(`Entry must be balanced. Total debits (${totalDebits.toFixed(2)}) must equal total credits (${totalCredits.toFixed(2)})`);
        return;
      }
      
      // Validation: Each line must have either debit or credit amount (not both)
      const invalidLines = formData.lines.filter(line => 
        (parseFloat(line.debitAmount) > 0 && parseFloat(line.creditAmount) > 0) ||
        (parseFloat(line.debitAmount) === 0 && parseFloat(line.creditAmount) === 0)
      );
      
      if (invalidLines.length > 0) {
        setError('Each line must have either a debit amount OR a credit amount (not both, not neither)');
        return;
      }
      
      const payload = {
        ...formData,
        adjustmentDate: formData.adjustmentDate.toISOString().split('T')[0],
        lines: formData.lines.map(line => ({
          ...line,
          adjustmentDetails: {
            accrualType: line.accrualType || null,
            accrualPeriod: line.accrualPeriod,
            accrualRate: line.accrualRate,
            deferralType: line.deferralType || null,
            deferralPeriod: line.deferralPeriod,
            totalAmount: line.totalAmount,
            adjustmentMethod: line.adjustmentMethod || null
          }
        }))
      };
      
      await accountingCycleAPI.createAdjustedEntry(payload);
      
      setSuccess('Adjusted entry created successfully');
      setOpenDialog(false);
      resetForm();
      fetchAdjustedEntries();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create adjusted entry');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEntry = async (entryId) => {
    try {
      setLoading(true);
      setError('');
      
      await accountingCycleAPI.approveAdjustedEntry(entryId);
      
      setSuccess('Entry approved and posted successfully');
      fetchAdjustedEntries();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve entry');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      adjustmentDate: new Date(),
      adjustmentType: 'year_end',
      lines: [],
      autoCalculate: false,
      referenceTransactions: []
    });
  };

  const addJournalLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        accountId: '',
        debitAmount: 0,
        creditAmount: 0,
        description: '',
        accrualType: '',
        accrualPeriod: 1,
        accrualRate: 100,
        deferralType: '',
        deferralPeriod: 1,
        totalAmount: 0,
        adjustmentMethod: 'zero_balance'
      }]
    }));
  };

  const updateJournalLine = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const removeJournalLine = (index) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const getTotalDebits = () => {
    const total = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
    console.log('UI getTotalDebits:', total);
    return total;
  };

  const getTotalCredits = () => {
    const total = formData.lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
    console.log('UI getTotalCredits:', total);
    return total;
  };

  const isEntryBalanced = () => {
    const debits = getTotalDebits();
    const credits = getTotalCredits();
    const difference = Math.abs(debits - credits);
    const balanced = difference < 0.01;
    console.log('UI Balance Check:', { debits, credits, difference, balanced });
    return balanced;
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc._id === accountId);
    return account ? `${account.accountCode} - ${account.accountName}` : '';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Adjusted Journal Entries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Year-end adjustments and correcting entries
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{ boxShadow: 2 }}
            >
              Create Adjusted Entry
            </Button>
            <IconButton onClick={fetchAdjustedEntries} color="primary" sx={{ boxShadow: 2 }}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Date Range Selector */}
        <Card sx={{ borderRadius: 3, mb: 4, boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filter by Period
              </Typography>
            </Box>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  onClick={() => setDateRange({
                    startDate: new Date(new Date().getFullYear(), 0, 1),
                    endDate: new Date(),
                  })}
                  fullWidth
                >
                  Current Year
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Adjusted Entries List */}
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Adjusted Entries History
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : adjustedEntries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Info sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No adjusted entries found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first adjusted entry to get started
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Entry Number</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Total Debit</TableCell>
                      <TableCell align="right">Total Credit</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adjustedEntries.map((entry) => (
                      <TableRow key={entry._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {entry.entryNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(entry.entryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {entry.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={entry.adjustmentType || 'Standard'} 
                            variant="outlined"
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'success.main' }}>
                            {formatCurrency(entry.totalDebit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'error.main' }}>
                            {formatCurrency(entry.totalCredit)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={entry.status} 
                            color={entry.status === 'posted' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {entry.status === 'draft' && (
                              <IconButton 
                                size="small" 
                                color="success"
                                title="Approve Entry"
                                onClick={() => handleApproveEntry(entry._id)}
                                disabled={loading}
                              >
                                <CheckCircle />
                              </IconButton>
                            )}
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                            {entry.adjustmentType && entry.adjustmentType !== 'reversal' && (
                              <IconButton 
                                size="small" 
                                color="warning"
                                title="Create Reversing Entry"
                              >
                                <Refresh />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Create Adjusted Entry Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PostAdd sx={{ mr: 1 }} />
              Create Adjusted Journal Entry
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Adjustment Date"
                  value={formData.adjustmentDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, adjustmentDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Adjustment Type</InputLabel>
                  <Select
                    value={formData.adjustmentType}
                    label="Adjustment Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, adjustmentType: e.target.value }))}
                  >
                    <MenuItem value="year_end">Year-End Adjustment</MenuItem>
                    <MenuItem value="correcting">Correcting Entry</MenuItem>
                    <MenuItem value="accrual">Accrual Adjustment</MenuItem>
                    <MenuItem value="deferral">Deferral Adjustment</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Auto Calculate</InputLabel>
                  <Select
                    value={formData.autoCalculate}
                    label="Auto Calculate"
                    onChange={(e) => setFormData(prev => ({ ...prev, autoCalculate: e.target.value }))}
                  >
                    <MenuItem value={false}>Manual Entry</MenuItem>
                    <MenuItem value={true}>Auto Calculate</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Journal Lines
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={addJournalLine}
                  variant="outlined"
                  size="small"
                >
                  Add Line
                </Button>
              </Box>

              {formData.lines.map((line, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main' }}>
                      Line {index + 1}
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Account</InputLabel>
                          <Select
                            value={line.accountId}
                            label="Account"
                            onChange={(e) => updateJournalLine(index, 'accountId', e.target.value)}
                          >
                            {Array.isArray(accounts) && accounts.map((account) => (
                              <MenuItem key={account._id} value={account._id}>
                                {account.accountCode} - {account.accountName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Debit Amount"
                          type="number"
                          size="small"
                          value={line.debitAmount}
                          onChange={(e) => {
                            updateJournalLine(index, 'debitAmount', e.target.value);
                            // Clear credit amount when debit is entered
                            if (parseFloat(e.target.value) > 0) {
                              updateJournalLine(index, 'creditAmount', '0');
                            }
                          }}
                          disabled={formData.autoCalculate}
                          helperText={parseFloat(line.creditAmount) > 0 ? "Cannot enter both debit and credit" : ""}
                          error={parseFloat(line.creditAmount) > 0}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Credit Amount"
                          type="number"
                          size="small"
                          value={line.creditAmount}
                          onChange={(e) => {
                            updateJournalLine(index, 'creditAmount', e.target.value);
                            // Clear debit amount when credit is entered
                            if (parseFloat(e.target.value) > 0) {
                              updateJournalLine(index, 'debitAmount', '0');
                            }
                          }}
                          disabled={formData.autoCalculate}
                          helperText={parseFloat(line.debitAmount) > 0 ? "Cannot enter both debit and credit" : ""}
                          error={parseFloat(line.debitAmount) > 0}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Description"
                          size="small"
                          value={line.description}
                          onChange={(e) => updateJournalLine(index, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <IconButton 
                          onClick={() => removeJournalLine(index)}
                          color="error"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                    
                    {/* Adjustment-specific fields */}
                    {formData.adjustmentType === 'accrual' && formData.autoCalculate && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Accrual Type</InputLabel>
                            <Select
                              value={line.accrualType}
                              label="Accrual Type"
                              onChange={(e) => updateJournalLine(index, 'accrualType', e.target.value)}
                            >
                              <MenuItem value="revenue">Revenue Accrual</MenuItem>
                              <MenuItem value="expense">Expense Accrual</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Period (months)"
                            type="number"
                            size="small"
                            value={line.accrualPeriod}
                            onChange={(e) => updateJournalLine(index, 'accrualPeriod', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Rate (%)"
                            type="number"
                            size="small"
                            value={line.accrualRate}
                            onChange={(e) => updateJournalLine(index, 'accrualRate', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    )}
                    
                    {formData.adjustmentType === 'deferral' && formData.autoCalculate && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Deferral Type</InputLabel>
                            <Select
                              value={line.deferralType}
                              label="Deferral Type"
                              onChange={(e) => updateJournalLine(index, 'deferralType', e.target.value)}
                            >
                              <MenuItem value="expense">Prepaid Expense</MenuItem>
                              <MenuItem value="revenue">Unearned Revenue</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Period (months)"
                            type="number"
                            size="small"
                            value={line.deferralPeriod}
                            onChange={(e) => updateJournalLine(index, 'deferralPeriod', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Total Amount"
                            type="number"
                            size="small"
                            value={line.totalAmount}
                            onChange={(e) => updateJournalLine(index, 'totalAmount', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    )}
                    
                                        
                    {formData.adjustmentType === 'year_end' && formData.autoCalculate && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Adjustment Method</InputLabel>
                            <Select
                              value={line.adjustmentMethod}
                              label="Adjustment Method"
                              onChange={(e) => updateJournalLine(index, 'adjustmentMethod', e.target.value)}
                            >
                              <MenuItem value="zero_balance">Zero Balance</MenuItem>
                              <MenuItem value="proportional">Proportional</MenuItem>
                              <MenuItem value="fixed">Fixed Amount</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              ))}

              {formData.lines.length > 0 && (
                <Card sx={{ mt: 2, bgcolor: isEntryBalanced() ? 'success.light' : 'error.light' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Entry Balance Status
                      </Typography>
                      <Chip 
                        label={isEntryBalanced() ? 'Balanced ✓' : 'Not Balanced ✗'}
                        color={isEntryBalanced() ? 'success' : 'error'}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Total Debits: {formatCurrency(getTotalDebits())}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Total Credits: {formatCurrency(getTotalCredits())}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Difference: {formatCurrency(Math.abs(getTotalDebits() - getTotalCredits()))}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateAdjustedEntry}
              variant="contained"
              disabled={!isEntryBalanced() || formData.lines.length === 0 || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PostAdd />}
            >
              Create Adjusted Entry
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AdjustedEntries;
