import React, { useState, useEffect, useRef } from 'react';
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
  Tabs,
  Tab,
  Grid,
  Divider,
  Chip,
  Fab,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Zoom,
  Backdrop,
} from '@mui/material';
import { 
  ArrowBack, 
  Download,
  Print,
  Description,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  PictureAsPdf,
  GetApp,
  Refresh,
  Share,
  FilterAlt,
  Summarize,
  Assessment,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { reportsAPI } from '../services/api';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-statement-tabpanel-${index}`}
      aria-labelledby={`financial-statement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const FinancialStatements = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [tabValue, setTabValue] = useState(0);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);
  const incomeStatementRef = useRef(null);
  const balanceSheetRef = useRef(null);
  const cashFlowRef = useRef(null);
  const componentRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const params = {
          startDate: filters.startDate?.toISOString().split('T')[0],
          endDate: filters.endDate?.toISOString().split('T')[0],
        };
        
        if (tabValue === 0) {
          const response = await reportsAPI.getIncomeStatement(params);
          setIncomeStatement(response.data);
        } else if (tabValue === 1) {
          const response = await reportsAPI.getBalanceSheet(params);
          setBalanceSheet(response.data);
        } else if (tabValue === 2) {
          const response = await reportsAPI.getCashFlow(params);
          setCashFlow(response.data);
        }
      } catch (err) {
        setError(`Failed to load ${tabValue === 0 ? 'income statement' : tabValue === 1 ? 'balance sheet' : 'cash flow statement'}`);
        console.error('Financial statements error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tabValue, filters]);

  const handleFilterChange = (field) => (value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount) => {
    return `Frw ${Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${tabValue === 0 ? 'Income Statement' : tabValue === 1 ? 'Balance Sheet' : 'Cash Flow Statement'} - ${new Date().toLocaleDateString()}`,
  });

  const handlePDFDownload = async () => {
    setIsExporting(true);
    try {
      const element = componentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${tabValue === 0 ? 'Income_Statement' : tabValue === 1 ? 'Balance_Sheet' : 'Cash_Flow_Statement'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    setFilters({ ...filters, endDate: new Date() });
  };

  const getCurrentRef = () => {
    switch (tabValue) {
      case 0:
        return incomeStatementRef;
      case 1:
        return balanceSheetRef;
      case 2:
        return cashFlowRef;
      default:
        return componentRef;
    }
  };

  const renderIncomeStatement = () => {
    if (!incomeStatement) return null;

    return (
      <Card ref={incomeStatementRef} sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                Income Statement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                For the period from {filters.startDate?.toLocaleDateString() || 'Beginning'} to {filters.endDate?.toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                icon={<TrendingUp />} 
                label={`Net Income: ${formatCurrency(incomeStatement.netIncome)}`}
                color={incomeStatement.netIncome >= 0 ? 'success' : 'error'}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ bgcolor: 'success.light', opacity: 0.1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.dark', display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    REVENUE
                  </Typography>
                  {incomeStatement.revenue?.details?.map((item, index) => (
                    <Box key={`revenue-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                      <Typography variant="body2" sx={{ pl: 2 }}>
                        {item.accountName}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total Revenue</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(incomeStatement.revenue?.total)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ bgcolor: 'warning.light', opacity: 0.1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'warning.dark', display: 'flex', alignItems: 'center' }}>
                    <TrendingDown sx={{ mr: 1 }} />
                    EXPENSES
                  </Typography>
                  {incomeStatement.expenses?.details?.map((item, index) => (
                    <Box key={`expense-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                      <Typography variant="body2" sx={{ pl: 2 }}>
                        {item.accountName}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total Expenses</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      {formatCurrency(incomeStatement.expenses?.total)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 3, bgcolor: 'primary.light', opacity: 0.1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                  NET INCOME
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  color: incomeStatement.netIncome >= 0 ? 'success.main' : 'error.main'
                }}>
                  {formatCurrency(incomeStatement.netIncome)}
                </Typography>
              </Box>
              {incomeStatement.grossMargin !== undefined && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Gross Margin: {incomeStatement.grossMargin.toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return null;

    return (
      <Card ref={balanceSheetRef} sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                Balance Sheet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As of {filters.endDate?.toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                icon={<AccountBalance />} 
                label={`Total Assets: ${formatCurrency(balanceSheet.totalAssets)}`}
                color="primary"
                sx={{ fontWeight: 600 }}
              />
              {balanceSheet.summary?.isBalanced && (
                <Chip 
                  label="Balanced"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Assets Section */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main', display: 'flex', alignItems: 'center' }}>
                    <AccountBalance sx={{ mr: 1 }} />
                    ASSETS
                  </Typography>
                  
                  {balanceSheet.assets?.details?.map((item, index) => (
                    <Box key={`asset-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.accountName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.accountCode}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>TOTAL ASSETS</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatCurrency(balanceSheet.totalAssets)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Liabilities & Equity Section */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main', display: 'flex', alignItems: 'center' }}>
                    <TrendingDown sx={{ mr: 1 }} />
                    LIABILITIES & EQUITY
                  </Typography>
                  
                  {/* Liabilities */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'error.dark' }}>
                    Liabilities
                  </Typography>
                  {balanceSheet.liabilities?.details?.map((item, index) => (
                    <Box key={`liability-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, pl: 2 }}>
                      <Box>
                        <Typography variant="body2">
                          {item.accountName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.accountCode}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, pl: 2 }}>Total Liabilities</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {formatCurrency(balanceSheet.totalLiabilities)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Equity */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.dark' }}>
                    Equity
                  </Typography>
                  {balanceSheet.equity?.details?.map((item, index) => (
                    <Box key={`equity-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, pl: 2 }}>
                      <Box>
                        <Typography variant="body2">
                          {item.accountName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.accountCode}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, pl: 2 }}>Total Equity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {formatCurrency(balanceSheet.totalEquity)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>TOTAL LIABILITIES & EQUITY</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'error.main' }}>
                      {formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {!balanceSheet.summary?.isBalanced && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              Balance sheet is not balanced. Difference: {formatCurrency(balanceSheet.summary?.difference || 0)}
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCashFlowStatement = () => {
    if (!cashFlow) return null;

    return (
      <Card ref={cashFlowRef} sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                Cash Flow Statement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                For the period from {filters.startDate?.toLocaleDateString() || 'Beginning'} to {filters.endDate?.toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                icon={<AccountBalance />} 
                label={`Net Cash Flow: ${formatCurrency(cashFlow.netCashFlow)}`}
                color={cashFlow.netCashFlow >= 0 ? 'success' : 'error'}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Cash Summary */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ bgcolor: 'info.light', opacity: 0.1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'info.dark', display: 'flex', alignItems: 'center' }}>
                    <AccountBalance sx={{ mr: 1 }} />
                    Cash Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2">Opening Balance</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(cashFlow.openingBalance)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2">Closing Balance</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {formatCurrency(cashFlow.closingBalance)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Net Change</Typography>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600, 
                      color: cashFlow.netCashFlow >= 0 ? 'success.main' : 'error.main' 
                    }}>
                      {formatCurrency(cashFlow.netCashFlow)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Cash Movements */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ bgcolor: 'success.light', opacity: 0.1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.dark', display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    Cash Inflows
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2">Total Inflows</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(cashFlow.cashMovements?.inflows || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Cash accounts involved:
                    </Typography>
                    {cashFlow.cashAccounts?.map((account, index) => (
                      <Typography key={index} variant="caption" sx={{ display: 'block', pl: 1 }}>
                        {account.accountCode} - {account.accountName}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ bgcolor: 'warning.light', opacity: 0.1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'warning.dark', display: 'flex', alignItems: 'center' }}>
                    <TrendingDown sx={{ mr: 1 }} />
                    Cash Outflows
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2">Total Outflows</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      {formatCurrency(cashFlow.cashMovements?.outflows || 0)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Net Flow</Typography>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600, 
                      color: (cashFlow.cashMovements?.inflows - cashFlow.cashMovements?.outflows) >= 0 ? 'success.main' : 'error.main' 
                    }}>
                      {formatCurrency((cashFlow.cashMovements?.inflows || 0) - (cashFlow.cashMovements?.outflows || 0))}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Reconciliation */}
          {cashFlow.reconciliation && (
            <Card sx={{ mt: 3, bgcolor: 'grey.100' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                  Reconciliation
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Opening Balance</Typography>
                      <Typography variant="body2">{formatCurrency(cashFlow.reconciliation.openingBalance)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Net Change</Typography>
                      <Typography variant="body2">{formatCurrency(cashFlow.reconciliation.netChange)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Closing Balance</Typography>
                      <Typography variant="body2">{formatCurrency(cashFlow.reconciliation.closingBalance)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Status</Typography>
                      <Chip 
                        label={cashFlow.reconciliation.matches ? "Reconciled" : "Not Reconciled"}
                        color={cashFlow.reconciliation.matches ? "success" : "error"}
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/reports')}
            sx={{ mr: { xs: 0, md: 2 } }}
          >
            Back to Reports
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            Financial Statements
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Report">
              <IconButton onClick={handlePrint} color="primary">
                <Print />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <FilterAlt sx={{ mr: 1 }} />
              Period Filters
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={handleFilterChange('startDate')}
                slots={{ textField: TextField }}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={handleFilterChange('endDate')}
                slots={{ textField: TextField }}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              <Button
                variant="outlined"
                onClick={() => setFilters({ 
                  startDate: null, 
                  endDate: new Date() 
                })}
                startIcon={<Refresh />}
              >
                Clear Filters
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Statement Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
          >
            <Tab 
              icon={<TrendingUp />} 
              label={isMobile ? "Income" : "Income Statement"} 
              iconPosition="start"
              sx={{ minWidth: isMobile ? 100 : 150 }}
            />
            <Tab 
              icon={<AccountBalance />} 
              label={isMobile ? "Balance" : "Balance Sheet"} 
              iconPosition="start"
              sx={{ minWidth: isMobile ? 100 : 150 }}
            />
            <Tab 
              icon={<Assessment />} 
              label={isMobile ? "Cash Flow" : "Cash Flow Statement"} 
              iconPosition="start"
              sx={{ minWidth: isMobile ? 100 : 150 }}
            />
          </Tabs>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        <Box ref={componentRef}>
          {!loading && (
            <>
              <TabPanel value={tabValue} index={0}>
                {renderIncomeStatement()}
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                {renderBalanceSheet()}
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                {renderCashFlowStatement()}
              </TabPanel>
            </>
          )}
        </Box>

        {/* Floating Action Buttons */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Zoom in={true}>
            <Fab
              color="primary"
              onClick={handlePDFDownload}
              disabled={isExporting}
              sx={{ boxShadow: 4 }}
            >
              {isExporting ? <CircularProgress size={24} color="inherit" /> : <PictureAsPdf />}
            </Fab>
          </Zoom>
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Fab
              color="secondary"
              onClick={handlePrint}
              sx={{ boxShadow: 4 }}
            >
              <Print />
            </Fab>
          </Zoom>
        </Box>

        {/* Backdrop for export loading */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isExporting}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" />
            <Typography variant="h6">Generating PDF...</Typography>
          </Box>
        </Backdrop>
      </Box>
    </LocalizationProvider>
  );
};

export default FinancialStatements;
