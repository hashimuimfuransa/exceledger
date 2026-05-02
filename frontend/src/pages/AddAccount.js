import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { accountsAPI } from '../services/api';

const AddAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: '',
    normalBalance: '',
    description: '',
    isActive: true,
  });

  const accountTypes = [
    'asset',
    'liability',
    'equity',
    'revenue',
    'expense',
  ];

  const normalBalances = ['debit', 'credit'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.accountCode || !formData.accountName || !formData.accountType || !formData.normalBalance) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await accountsAPI.create(formData);
      navigate('/accounts');
    } catch (err) {
      setError('Failed to create account');
      console.error('Create account error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/accounts');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleCancel}
          sx={{ mr: 2 }}
        >
          Back to Accounts
        </Button>
        <Typography variant="h4">
          Add New Account
        </Typography>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="accountCode"
                  label="Account Code"
                  value={formData.accountCode}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="e.g., 1001"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="accountName"
                  label="Account Name"
                  value={formData.accountName}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="e.g., Cash on Hand"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    label="Account Type"
                  >
                    {accountTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Normal Balance</InputLabel>
                  <Select
                    name="normalBalance"
                    value={formData.normalBalance}
                    onChange={handleChange}
                    label="Normal Balance"
                  >
                    {normalBalances.map((balance) => (
                      <MenuItem key={balance} value={balance}>
                        {balance}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Optional description of the account"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="isActive"
                    value={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    label="Status"
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddAccount;
