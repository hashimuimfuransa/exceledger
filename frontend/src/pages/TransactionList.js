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
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Send,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { journalAPI } from '../services/api';

const TransactionList = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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
  }, [page, statusFilter]);

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

  const filteredTransactions = transactions.filter(transaction =>
    transaction.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              Filter
            </Button>
          </Box>

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
                {filteredTransactions.map((transaction) => (
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && !selectedTransaction}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => setStatusFilter('')}>All Status</MenuItem>
        <MenuItem onClick={() => setStatusFilter('draft')}>Draft</MenuItem>
        <MenuItem onClick={() => setStatusFilter('posted')}>Posted</MenuItem>
        <MenuItem onClick={() => setStatusFilter('voided')}>Voided</MenuItem>
      </Menu>
    </Box>
  );
};

export default TransactionList;
