import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { accountsAPI } from '../services/api';

const Accounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch accounts from backend API
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await accountsAPI.getAll();
        setAccounts(response.data.accounts || []);
      } catch (err) {
        setError('Failed to load accounts');
        console.error('Accounts error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleMenuClick = (event, account) => {
    setAnchorEl(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAccount(null);
  };

  const handleEdit = () => {
    // Navigate to edit account page
    console.log('Edit account:', selectedAccount);
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    try {
      await accountsAPI.delete(selectedAccount._id);
      setAccounts(accounts.filter(a => a._id !== selectedAccount._id));
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
    } catch (err) {
      setError('Failed to delete account');
      console.error('Delete account error:', err);
    }
  };

  const handleViewTransactions = () => {
    // Navigate to transactions filtered by this account
    navigate(`/transactions?account=${selectedAccount._id}`);
    handleMenuClose();
  };

  const getAccountIcon = (accountType) => {
    switch (accountType) {
      case 'asset':
        return <AccountBalanceWallet sx={{ color: 'success.main' }} />;
      case 'liability':
        return <TrendingDown sx={{ color: 'error.main' }} />;
      case 'equity':
        return <AccountBalance sx={{ color: 'primary.main' }} />;
      case 'revenue':
        return <TrendingUp sx={{ color: 'success.main' }} />;
      case 'expense':
        return <TrendingDown sx={{ color: 'warning.main' }} />;
      default:
        return <AccountBalance />;
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  const filteredAccounts = accounts.filter(account =>
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountType.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Chart of Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/accounts/new')}
        >
          Add Account
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent sx={{ pb: 1 }}>
                  <AccountBalanceWallet sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6">
                    {accounts.filter(a => a.accountType === 'asset').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assets
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent sx={{ pb: 1 }}>
                  <TrendingDown sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
                  <Typography variant="h6">
                    {accounts.filter(a => a.accountType === 'liability').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Liabilities
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent sx={{ pb: 1 }}>
                  <AccountBalance sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">
                    {accounts.filter(a => a.accountType === 'equity').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Equity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent sx={{ pb: 1 }}>
                  <TrendingUp sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6">
                    {accounts.filter(a => a.accountType === 'revenue').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revenue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent sx={{ pb: 1 }}>
                  <TrendingDown sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6">
                    {accounts.filter(a => a.accountType === 'expense').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expenses
                  </Typography>
                </CardContent>
              </Card>
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
                  <TableCell>Account Code</TableCell>
                  <TableCell>Account Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getAccountIcon(account.accountType)}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {account.accountCode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {account.accountName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {account.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                        size="small"
                        color={account.accountType === 'asset' || account.accountType === 'revenue' ? 'success' : 'primary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Balance: N/A
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {account.normalBalance.charAt(0).toUpperCase() + account.normalBalance.slice(1)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={getStatusColor(account.isActive)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, account)}
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
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewTransactions}>
          <TrendingUp sx={{ mr: 1 }} />
          View Transactions
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Edit Account
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Account
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the account "{selectedAccount?.accountName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Accounts;
