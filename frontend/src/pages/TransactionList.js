import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  Chip,
  Pagination,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Send,
  Clear,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { journalAPI } from '../services/api';

const TransactionList = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError('');

        const params = {
          page,
          limit: 10,
        };

        if (statusFilter) params.status = statusFilter;
        if (entryTypeFilter) params.entryType = entryTypeFilter;
        if (startDate) params.startDate = startDate.toISOString().split('T')[0];
        if (endDate) params.endDate = endDate.toISOString().split('T')[0];
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;

        const response = await journalAPI.getAll(params);
        setTransactions(response.data.entries || []);
        setTotalPages(response.data.pagination?.pages || 1);

      } catch (err) {
        setError('Failed to load transactions');
        console.error('Transaction list error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, statusFilter, entryTypeFilter, startDate, endDate, debouncedSearchTerm]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleMenuClick = (event, transaction) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransaction(null);
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setEntryTypeFilter('');
    setStartDate(null);
    setEndDate(null);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setPage(1);
  };

  const handleView = () => {
    // Navigate to transaction details
    navigate(`/transactions/${selectedTransaction._id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    // Navigate to edit transaction
    navigate(`/transactions/${selectedTransaction._id}/edit`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;

    try {
      await journalAPI.delete(selectedTransaction._id);
      setTransactions(transactions.filter(t => t._id !== selectedTransaction._id));
      handleMenuClose();
    } catch (err) {
      setError('Failed to delete transaction');
    }
  };

  const handlePost = async () => {
    if (!selectedTransaction) return;

    try {
      await journalAPI.postEntry(selectedTransaction._id);
      setTransactions(transactions.map(t =>
        t._id === selectedTransaction._id
          ? { ...t, status: 'posted' }
          : t
      ));
      handleMenuClose();
    } catch (err) {
      setError('Failed to post transaction');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'posted':
        return 'success';
      case 'draft':
        return 'warning';
      case 'voided':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Transactions
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/transactions/new')}
          >
            Add Transaction
          </Button>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        ) : null}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="posted">Posted</MenuItem>
                    <MenuItem value="voided">Voided</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Entry Type</InputLabel>
                  <Select
                    value={entryTypeFilter}
                    onChange={(e) => setEntryTypeFilter(e.target.value)}
                    label="Entry Type"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="adjusting">Adjusting</MenuItem>
                    <MenuItem value="reversing">Reversing</MenuItem>
                    <MenuItem value="closing">Closing</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Entry #, description..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

      <Card>
        <CardContent>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Entry Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{transaction.entryNumber}</TableCell>
                    <TableCell>
                      {new Date(transaction.entryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell align="right">
                      Frw {transaction.totalDebit.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      Frw {transaction.totalCredit.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, transaction)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          ) : null}
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedTransaction?.status === 'draft' ? (
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        ) : null}
        {selectedTransaction?.status === 'draft' ? (
          <MenuItem onClick={handlePost}>
            <Send sx={{ mr: 1 }} />
            Post Transaction
          </MenuItem>
        ) : null}
        {selectedTransaction?.status === 'draft' ? (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        ) : null}
      </Menu>
      </Box>
    </LocalizationProvider>
  );
};

export default TransactionList;
