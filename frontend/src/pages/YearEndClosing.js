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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CalendarToday,
  Description,
  AccountBalance,
  TrendingUp,
  Info,
  CheckCircle,
  Warning,
  Refresh,
  PostAdd,
  ExpandMore,
  Assessment,
  Summarize,
  ArrowForward,
  Lock,
  LockOpen,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingCycleAPI, reportsAPI } from '../services/api';

const formatCurrency = (amount) => {
  return `Frw ${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const YearEndClosing = () => {
  const theme = useTheme();
  const [closingEntries, setClosingEntries] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openClosingDialog, setOpenClosingDialog] = useState(false);
  const [openNewYearDialog, setOpenNewYearDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [closingData, setClosingData] = useState({
    closingDate: new Date(),
    fiscalYear: new Date().getFullYear(),
  });
  const [newYearData, setNewYearData] = useState({
    newFiscalYear: new Date().getFullYear() + 1,
    openingDate: new Date(new Date().getFullYear() + 1, 0, 1),
  });

  const steps = [
    'Review Financial Summary',
    'Validate Trial Balance',
    'Perform Year-End Closing',
    'Open New Fiscal Year',
  ];

  useEffect(() => {
    fetchClosingEntries();
    fetchFinancialSummary();
  }, [fiscalYear]);

  const fetchClosingEntries = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await accountingCycleAPI.getClosingEntries({
        fiscalYear: fiscalYear,
      });
      
      setClosingEntries(response.data.closingEntries);
    } catch (err) {
      setError('Failed to load closing entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const yearStart = new Date(fiscalYear, 0, 1);
      const yearEnd = new Date(fiscalYear, 11, 31);
      
      const response = await reportsAPI.getIncomeStatement({
        startDate: yearStart.toISOString().split('T')[0],
        endDate: yearEnd.toISOString().split('T')[0],
      });
      
      setFinancialSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch financial summary:', err);
    }
  };

  const handleYearEndClosing = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await accountingCycleAPI.performYearEndClosing({
        closingDate: closingData.closingDate.toISOString().split('T')[0],
        fiscalYear: closingData.fiscalYear,
      });
      
      setSuccess('Year-end closing completed successfully');
      setOpenClosingDialog(false);
      setActiveStep(2);
      fetchClosingEntries();
      fetchFinancialSummary();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform year-end closing');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewYear = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await accountingCycleAPI.openNewYear({
        newFiscalYear: newYearData.newFiscalYear,
        openingDate: newYearData.openingDate.toISOString().split('T')[0],
      });
      
      setSuccess('New fiscal year opened successfully');
      setOpenNewYearDialog(false);
      setActiveStep(3);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open new year');
    } finally {
      setLoading(false);
    }
  };

  const isYearClosed = () => {
    return closingEntries.some(entry => 
      entry.entryType === 'closing' && 
      new Date(entry.entryDate).getFullYear() === fiscalYear
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Assessment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Year-End Closing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete the accounting cycle and prepare for the new fiscal year
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Fiscal Year"
              type="number"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(parseInt(e.target.value))}
              size="small"
              sx={{ width: 120 }}
            />
            <IconButton onClick={() => {
              fetchClosingEntries();
              fetchFinancialSummary();
            }} color="primary" sx={{ boxShadow: 2 }}>
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

        {/* Stepper */}
        <Card sx={{ borderRadius: 3, mb: 4, boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Accounting Cycle Steps
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {label}
                      </Typography>
                      {isYearClosed() && index <= 2 && (
                        <CheckCircle sx={{ ml: 1, color: 'success.main', fontSize: 20 }} />
                      )}
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {index === 0 && "Review the financial performance for the fiscal year."}
                      {index === 1 && "Ensure all accounts are balanced before closing."}
                      {index === 2 && "Close revenue and expense accounts to retained earnings."}
                      {index === 3 && "Set up opening balances for the new fiscal year."}
                    </Typography>
                    {index === 0 && financialSummary && (
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep(1)}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Continue
                      </Button>
                    )}
                    {index === 1 && (
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep(2)}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Continue
                      </Button>
                    )}
                    {index === 2 && !isYearClosed() && (
                      <Button
                        variant="contained"
                        onClick={() => setOpenClosingDialog(true)}
                        sx={{ mt: 1, mr: 1 }}
                        startIcon={<Lock />}
                      >
                        Perform Year-End Closing
                      </Button>
                    )}
                    {index === 3 && isYearClosed() && (
                      <Button
                        variant="contained"
                        onClick={() => setOpenNewYearDialog(true)}
                        sx={{ mt: 1, mr: 1 }}
                        startIcon={<LockOpen />}
                      >
                        Open New Fiscal Year
                      </Button>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        {financialSummary && (
          <Card sx={{ borderRadius: 3, mb: 4, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Financial Summary for {fiscalYear}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(financialSummary.revenue?.total || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Total Expenses
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(financialSummary.expenses?.total || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Summarize sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Net Income
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(financialSummary.netIncome || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Assessment sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        PBIT
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {formatCurrency(financialSummary.profitMetrics?.pbit || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Closing Entries History */}
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Closing Entries History
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : closingEntries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Info sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No closing entries found for {fiscalYear}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete the year-end closing process to generate closing entries
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
                      <TableCell align="right">Total Debit</TableCell>
                      <TableCell align="right">Total Credit</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {closingEntries.map((entry) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Year-End Closing Dialog */}
        <Dialog 
          open={openClosingDialog} 
          onClose={() => setOpenClosingDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Lock sx={{ mr: 1 }} />
              Confirm Year-End Closing
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This action will close all revenue and expense accounts for {fiscalYear} 
                and transfer the balances to retained earnings. This action cannot be undone.
              </Typography>
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Closing Date"
                  value={closingData.closingDate}
                  onChange={(date) => setClosingData(prev => ({ ...prev, closingDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fiscal Year"
                  type="number"
                  value={closingData.fiscalYear}
                  onChange={(e) => setClosingData(prev => ({ ...prev, fiscalYear: parseInt(e.target.value) }))}
                />
              </Grid>
            </Grid>

            {financialSummary && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Closing Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue to Close
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(financialSummary.revenue?.total || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Expenses to Close
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(financialSummary.expenses?.total || 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenClosingDialog(false)}>Cancel</Button>
            <Button
              onClick={handleYearEndClosing}
              variant="contained"
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Lock />}
            >
              Perform Year-End Closing
            </Button>
          </DialogActions>
        </Dialog>

        {/* Open New Year Dialog */}
        <Dialog 
          open={openNewYearDialog} 
          onClose={() => setOpenNewYearDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LockOpen sx={{ mr: 1 }} />
              Open New Fiscal Year
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This will create opening balances for all balance sheet accounts in the new fiscal year.
              </Typography>
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="New Fiscal Year"
                  type="number"
                  value={newYearData.newFiscalYear}
                  onChange={(e) => setNewYearData(prev => ({ ...prev, newFiscalYear: parseInt(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Opening Date"
                  value={newYearData.openingDate}
                  onChange={(date) => setNewYearData(prev => ({ ...prev, openingDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenNewYearDialog(false)}>Cancel</Button>
            <Button
              onClick={handleOpenNewYear}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <LockOpen />}
            >
              Open New Year
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default YearEndClosing;
