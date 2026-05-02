import React, { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import { 
  ArrowBack, 
  Download,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Visibility,
  Assessment,
  Receipt
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { journalAPI } from '../services/api';

const PostedTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: new Date(),
    accountType: 'all',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    const fetchPostedTransactions = async () => {
      try {
        setLoading(true);
        setError('');
        
        const params = {
          status: 'posted',
          page: pagination.page,
          limit: pagination.limit,
        };
        
        if (filters.startDate) {
          params.startDate = filters.startDate.toISOString().split('T')[0];
        }
        if (filters.endDate) {
          params.endDate = filters.endDate.toISOString().split('T')[0];
        }
        if (filters.search) {
          params.search = filters.search;
        }
        
        const response = await journalAPI.getAll(params);
        setTransactions(response.data.entries || []);
        setPagination(response.data.pagination || pagination);
      } catch (err) {
        setError('Failed to load posted transactions');
        console.error('Posted transactions error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPostedTransactions();
  }, [pagination.page, pagination.limit, filters]);

  const handleFilterChange = (field) => (value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewLedger = (accountId) => {
    navigate(`/accounts/${accountId}/ledger`);
  };

  const handleViewTransaction = (transactionId) => {
    navigate(`/transactions/${transactionId}`);
  };

  const handleViewTrialBalance = () => {
    navigate('/reports/trial-balance');
  };

  const handleViewFinancialStatements = () => {
    navigate('/reports/financial-statements');
  };

  const getAccountIcon = (accountType) => {
    switch (accountType) {
      case 'asset':
        return <AccountBalance sx={{ color: 'success.main', fontSize: 16 }} />;
      case 'liability':
        return <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />;
      case 'equity':
        return <AccountBalance sx={{ color: 'primary.main', fontSize: 16 }} />;
      case 'revenue':
        return <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />;
      case 'expense':
        return <TrendingDown sx={{ color: 'warning.main', fontSize: 16 }} />;
      default:
        return <AccountBalance sx={{ fontSize: 16 }} />;
    }
  };

  const formatCurrency = (amount) => {
    return `Frw ${Math.abs(amount).toLocaleString()}`;
  };

  const getTransactionTotal = (transaction) => {
    return transaction.lines?.reduce((total, line) => {
      return total + (line.debitAmount || line.creditAmount || 0);
    }, 0) || 0;
  };

  if (loading && transactions.length === 0) {
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
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4">
            Posted Transactions
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Quick Actions */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  startIcon={<Assessment />}
                  onClick={handleViewTrialBalance}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Trial Balance
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<Receipt />}
                  onClick={handleViewFinancialStatements}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Financial Statements
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<AccountBalance />}
                  onClick={() => navigate('/accounts')}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  View All Ledgers
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Export Posted
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={handleFilterChange('startDate')}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={handleFilterChange('endDate')}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search')(e.target.value)}
                  placeholder="Search by description, reference..."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    value={filters.accountType}
                    onChange={(e) => handleFilterChange('accountType')(e.target.value)}
                    label="Account Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="asset">Assets</MenuItem>
                    <MenuItem value="liability">Liabilities</MenuItem>
                    <MenuItem value="equity">Equity</MenuItem>
                    <MenuItem value="revenue">Revenue</MenuItem>
                    <MenuItem value="expense">Expenses</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setFilters({ 
                      startDate: null, 
                      endDate: new Date(), 
                      accountType: 'all',
                      search: ''
                    })}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Visibility />}
                    onClick={() => navigate('/transactions')}
                  >
                    All Transactions
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Posted Transactions Table */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Posted Transactions ({pagination.total} total)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Download />}
                size="small"
              >
                Export Current
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Entry Number</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Accounts</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(transaction.entryDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main' }
                          }}
                          onClick={() => handleViewTransaction(transaction._id)}
                        >
                          {transaction.entryNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {transaction.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {transaction.lines?.slice(0, 2).map((line, lineIndex) => (
                            <Box 
                              key={lineIndex} 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                              onClick={() => handleViewLedger(line.account._id)}
                            >
                              {getAccountIcon(line.account.accountType)}
                              <Typography variant="caption">
                                {line.account.accountCode} - {line.account.accountName}
                              </Typography>
                            </Box>
                          ))}
                          {transaction.lines?.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                              +{transaction.lines.length - 2} more...
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(getTransactionTotal(transaction))}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Transaction Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewTransaction(transaction._id)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Account Ledgers">
                            <IconButton
                              size="small"
                              onClick={() => transaction.lines?.[0] && handleViewLedger(transaction.lines[0].account._id)}
                            >
                              <AccountBalance fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No posted transactions found for this period
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                  Page {pagination.page} of {pagination.pages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default PostedTransactions;
