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
  TextField,
  Divider,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Settings,
  Business,
  Percent,
  CalendarToday,
  AttachMoney,
  Save,
  Refresh,
  Info,
} from '@mui/icons-material';
import { settingsAPI } from '../services/api';

const SettingsPage = () => {
  const theme = useTheme();
  const [settings, setSettings] = useState({
    companyName: '',
    taxRate: 0.30,
    interestRate: 0.15,
    fiscalYearEnd: '12-31',
    currency: 'Frw',
    address: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await settingsAPI.getSettings();
      setSettings(response.data);
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      
      await settingsAPI.updateSettings(settings);
      
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    let value = event.target.value;
    
    // Convert tax rate to decimal if it's a percentage
    if (field === 'taxRate' && typeof value === 'string') {
      // Remove % sign if present and convert to decimal
      value = value.replace('%', '');
      const numValue = parseFloat(value) / 100;
      // Handle zero and valid numbers properly
      if (value === '0' || value === '0%') {
        value = 0;
      } else if (!isNaN(numValue) && value !== '') {
        value = numValue;
      }
    }
    
    // Convert interest rate to decimal if it's a percentage
    if (field === 'interestRate' && typeof value === 'string') {
      // Remove % sign if present and convert to decimal
      value = value.replace('%', '');
      const numValue = parseFloat(value) / 100;
      // Handle zero and valid numbers properly
      if (value === '0' || value === '0%') {
        value = 0;
      } else if (!isNaN(numValue) && value !== '') {
        value = numValue;
      }
    }
    
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatTaxRate = (rate) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 48, height: 48 }}>
            <Settings sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Company Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your company information and tax settings
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={fetchSettings} color="primary" sx={{ boxShadow: 2 }}>
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

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Company Information
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={settings.companyName}
                    onChange={handleInputChange('companyName')}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={settings.address}
                    onChange={handleInputChange('address')}
                    variant="outlined"
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={settings.phone}
                    onChange={handleInputChange('phone')}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={settings.email}
                    onChange={handleInputChange('email')}
                    variant="outlined"
                    type="email"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Percent sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Financial Settings
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tax Rate"
                    value={formatTaxRate(settings.taxRate)}
                    onChange={handleInputChange('taxRate')}
                    variant="outlined"
                    helperText="Corporate tax rate for profit calculations"
                    InputProps={{
                      startAdornment: <Percent sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Interest Rate"
                    value={formatTaxRate(settings.interestRate)}
                    onChange={handleInputChange('interestRate')}
                    variant="outlined"
                    helperText="Annual interest rate for PBIT calculations"
                    InputProps={{
                      startAdornment: <Percent sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fiscal Year End"
                    value={settings.fiscalYearEnd}
                    onChange={handleInputChange('fiscalYearEnd')}
                    variant="outlined"
                    placeholder="MM-DD"
                    helperText="Month and day when fiscal year ends"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={settings.currency}
                      label="Currency"
                      onChange={handleInputChange('currency')}
                    >
                      <MenuItem value="Frw">Frw (Rwandan Franc)</MenuItem>
                      <MenuItem value="USD">USD (US Dollar)</MenuItem>
                      <MenuItem value="EUR">EUR (Euro)</MenuItem>
                      <MenuItem value="GBP">GBP (British Pound)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Rate Information:</strong> These rates are used to calculate expenses 
                  in your income statement when no specific expense accounts are found.
                  <br />
                  • Tax Rate: {formatTaxRate(settings.taxRate)} (for PBT calculations)
                  <br />
                  • Interest Rate: {formatTaxRate(settings.interestRate)} (for PBIT calculations)
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Tax Impact Preview */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Info sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Interest & Tax Impact on Financial Statements
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={2}>
                  <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Operating Profit
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        Frw 1,000,000
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Interest Rate
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {formatTaxRate(settings.interestRate)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Interest Expense
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        Frw {(1000000 * settings.interestRate).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Card sx={{ bgcolor: 'purple.50', border: '1px solid', borderColor: 'purple.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        PBIT
                      </Typography>
                      <Typography variant="h6" color="purple.main">
                        Frw 1,000,000
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Same as Gross Profit
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Card sx={{ bgcolor: 'orange.50', border: '1px solid', borderColor: 'orange.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        PBT
                      </Typography>
                      <Typography variant="h6" color="orange.main">
                        Frw {(1000000 - (1000000 * settings.interestRate)).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        After Interest
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Card sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Tax Expense
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        Frw {((1000000 - (1000000 * settings.interestRate)) * settings.taxRate).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Net Income
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        Frw {(1000000 - (1000000 * settings.interestRate) - ((1000000 - (1000000 * settings.interestRate)) * settings.taxRate)).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This preview shows the complete profit calculation flow: PBIT (same as Gross Profit) → 
                PBT (after interest deductions) → Net Income (after tax). The system will use these 
                rates to calculate interest and tax expenses on your income statement unless specific expense 
                accounts are created and used.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSaveSettings}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          sx={{ minWidth: 120, boxShadow: 2 }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsPage;
