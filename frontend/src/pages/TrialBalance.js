import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  ArrowBack, 
  Download,
  Refresh,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { trialBalanceAPI } from '../services/api';

const TrialBalance = () => {
  const navigate = useNavigate();
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: new Date(),
    accountType: 'all',
  });
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    const fetchTrialBalance = async () => {
      try {
        setLoading(true);
        setError('');
        
        const params = {
          startDate: filters.startDate?.toISOString().split('T')[0],
          endDate: filters.endDate?.toISOString().split('T')[0],
        };
        
        if (filters.accountType !== 'all') {
          params.accountType = filters.accountType;
        }
        
        const response = await trialBalanceAPI.generate(params);
        setTrialBalanceData(response.data);
      } catch (err) {
        setError('Failed to load trial balance');
        console.error('Trial balance error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialBalance();
  }, [filters]);

  const handleFilterChange = (field) => (value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleValidate = async () => {
    try {
      setValidating(true);
      const params = {
        startDate: filters.startDate?.toISOString().split('T')[0],
        endDate: filters.endDate?.toISOString().split('T')[0],
      };
      
      if (filters.accountType !== 'all') {
        params.accountType = filters.accountType;
      }
      
      const response = await trialBalanceAPI.validate(params);
      setValidationResult(response.data);
    } catch (err) {
      setError('Failed to validate trial balance');
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Frw ${Math.abs(amount).toLocaleString()}`;
  };

  const calculateTotals = () => {
    if (!trialBalanceData?.accounts) return { totalDebits: 0, totalCredits: 0, balanced: true };
    
    const totalDebits = trialBalanceData.accounts.reduce((sum, account) => 
      sum + (account.debitTotal || 0), 0);
    const totalCredits = trialBalanceData.accounts.reduce((sum, account) => 
      sum + (account.creditTotal || 0), 0);
    
    return {
      totalDebits,
      totalCredits,
      balanced: Math.abs(totalDebits - totalCredits) < 0.01
    };
  };

  const { totalDebits, totalCredits, balanced } = calculateTotals();
  const summary = trialBalanceData?.summary;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/reports')}
            sx={{ mr: 2 }}
          >
            Back to Reports
          </Button>
          <Typography variant="h4">
            Trial Balance
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={handleFilterChange('startDate')}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={handleFilterChange('endDate')}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    value={filters.accountType}
                    onChange={(e) => handleFilterChange('accountType')(e.target.value)}
                    label="Account Type"
                  >
                    <MenuItem value="all">All Accounts</MenuItem>
                    <MenuItem value="asset">Assets</MenuItem>
                    <MenuItem value="liability">Liabilities</MenuItem>
                    <MenuItem value="equity">Equity</MenuItem>
                    <MenuItem value="revenue">Revenue</MenuItem>
                    <MenuItem value="expense">Expenses</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setFilters({ 
                      startDate: null, 
                      endDate: new Date(), 
                      accountType: 'all' 
                    })}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleValidate}
                    disabled={validating}
                  >
                    Validate
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Validation Result */}
        {validationResult && (
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {validationResult.isValid ? (
                  <CheckCircle sx={{ color: 'success.main', fontSize: 30 }} />
                ) : (
                  <ErrorIcon sx={{ color: 'error.main', fontSize: 30 }} />
                )}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {validationResult.isValid ? 'Trial Balance is Valid' : 'Trial Balance is Invalid'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {validationResult.message}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Trial Balance Summary */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Debits
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {formatCurrency(totalDebits)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Credits
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency(totalCredits)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Difference
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 600, 
                    color: balanced ? 'success.main' : 'error.main' 
                  }}>
                    {formatCurrency(totalDebits - totalCredits)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Trial Balance Table */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Trial Balance Details
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Download />}
                size="small"
              >
                Export
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Account Code</TableCell>
                    <TableCell>Account Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Debit Balance</TableCell>
                    <TableCell align="right">Credit Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(trialBalanceData?.trialBalance || []).map((account, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {account.accountCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {account.accountName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={account.accountType}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {account.debitAmount > 0 ? (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(account.debitAmount)}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {account.creditAmount > 0 ? (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(account.creditAmount)}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!trialBalanceData?.trialBalance || trialBalanceData.trialBalance.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No accounts found for this period
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} sx={{ fontWeight: 600 }}>
                      Totals
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(summary?.totalDebits || totalDebits)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(summary?.totalCredits || totalCredits)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default TrialBalance;
