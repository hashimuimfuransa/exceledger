import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  Backdrop,
  Avatar,
  LinearProgress,
  Skeleton,
  TextField,
} from '@mui/material';
import {
  DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Download,
  Print,
  PictureAsPdf,
  Refresh,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Assessment,
  Summarize,
  Receipt,
  FilterAlt,
  GetApp,
  Share,
  Speed,
  Analytics,
  ShowChart,
  CurrencyExchange,
  AccountTree,
  Description,
} from '@mui/icons-material';
import { reportsAPI, trialBalanceAPI } from '../services/api';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatCurrency = (amount) => {
  return `Frw ${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null}
    </div>
  );
};

const Reports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    asOfDate: new Date(),
  });
  const [reports, setReports] = useState({
    incomeStatement: null,
    balanceSheet: null,
    cashFlow: null,
    trialBalance: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const componentRef = useRef(null);
  const incomeStatementRef = useRef(null);
  const balanceSheetRef = useRef(null);
  const cashFlowRef = useRef(null);
  const trialBalanceRef = useRef(null);

  useEffect(() => {
    if (tabValue === 0) fetchIncomeStatement();
    if (tabValue === 1) fetchBalanceSheet();
    if (tabValue === 2) fetchCashFlow();
    if (tabValue === 3) fetchTrialBalance();
  }, [tabValue, dateRange]);

  const fetchIncomeStatement = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await reportsAPI.getIncomeStatement({
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
      });
      
      setReports(prev => ({ ...prev, incomeStatement: response.data }));
    } catch (err) {
      setError('Failed to load income statement');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await reportsAPI.getBalanceSheet({
        asOfDate: dateRange.asOfDate.toISOString().split('T')[0],
      });
      
      setReports(prev => ({ ...prev, balanceSheet: response.data }));
    } catch (err) {
      setError('Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await reportsAPI.getCashFlow({
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
      });
      
      setReports(prev => ({ ...prev, cashFlow: response.data }));
    } catch (err) {
      setError('Failed to load cash flow statement');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await trialBalanceAPI.generate({
        asOfDate: dateRange.asOfDate.toISOString().split('T')[0],
      });
      
      setReports(prev => ({ ...prev, trialBalance: response.data }));
    } catch (err) {
      setError('Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDateChange = (field) => (date) => {
    setDateRange(prev => ({ ...prev, [field]: date }));
  };

  const handleExport = (reportType) => {
    // Export functionality to be implemented
    console.log(`Export ${reportType}`);
  };

  const handlePrint = useReactToPrint({
    content: () => {
      switch (tabValue) {
        case 0: return incomeStatementRef.current;
        case 1: return balanceSheetRef.current;
        case 2: return cashFlowRef.current;
        case 3: return trialBalanceRef.current;
        default: return componentRef.current;
      }
    },
    documentTitle: `${['Income Statement', 'Balance Sheet', 'Cash Flow Statement', 'Trial Balance'][tabValue]} - ${new Date().toLocaleDateString()}`,
  });

  const handlePDFDownload = async () => {
    setIsExporting(true);
    try {
      let element;
      switch (tabValue) {
        case 0: element = incomeStatementRef.current; break;
        case 1: element = balanceSheetRef.current; break;
        case 2: element = cashFlowRef.current; break;
        case 3: element = trialBalanceRef.current; break;
        default: element = componentRef.current;
      }

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

      const fileName = `${['Income_Statement', 'Balance_Sheet', 'Cash_Flow_Statement', 'Trial_Balance'][tabValue]}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Frw ${Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleRefresh = () => {
    setDateRange({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      asOfDate: new Date(),
    });
  };

  const getReportIcon = (index) => {
    switch (index) {
      case 0: return <TrendingUp />;
      case 1: return <AccountBalance />;
      case 2: return <CurrencyExchange />;
      case 3: return <Summarize />;
      default: return <Assessment />;
    }
  };

  const getReportColor = (index) => {
    switch (index) {
      case 0: return 'success';
      case 1: return 'primary';
      case 2: return 'info';
      case 3: return 'warning';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 48, height: 48 }}>
              <Analytics sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
                Financial Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive financial analysis and reporting
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} color="primary" sx={{ boxShadow: 2 }}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Report">
              <IconButton onClick={handlePrint} color="primary" sx={{ boxShadow: 2 }}>
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

        {/* Date Range Selector Card */}
        <Card sx={{ borderRadius: 3, mb: 4, boxShadow: 3, overflow: 'visible' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FilterAlt sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Report Period Selection
              </Typography>
            </Box>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={handleDateChange('startDate')}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true, size: 'small', variant: 'outlined' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={handleDateChange('endDate')}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true, size: 'small', variant: 'outlined' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="As Of Date"
                  value={dateRange.asOfDate}
                  onChange={handleDateChange('asOfDate')}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true, size: 'small', variant: 'outlined' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  onClick={handleRefresh}
                  startIcon={<Refresh />}
                  fullWidth
                  sx={{ py: 1.5, boxShadow: 2 }}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Report Type Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: 'Income Statement', desc: 'Revenue and expenses analysis', icon: <TrendingUp />, color: 'success' },
            { title: 'Balance Sheet', desc: 'Assets, liabilities and equity', icon: <AccountBalance />, color: 'primary' },
            { title: 'Cash Flow', desc: 'Cash movement tracking', icon: <CurrencyExchange />, color: 'info' },
            { title: 'Trial Balance', desc: 'Account balance verification', icon: <Summarize />, color: 'warning' },
          ].map((report, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: tabValue === index ? 2 : 1,
                  borderColor: tabValue === index ? `${report.color}.main` : 'divider',
                  bgcolor: tabValue === index ? `${report.color}.light` : 'background.paper',
                  opacity: tabValue === index ? 1 : 0.8,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    opacity: 1,
                  }
                }}
                onClick={() => setTabValue(index)}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: `${report.color}.main`, 
                    mx: 'auto', 
                    mb: 2,
                    width: 56,
                    height: 56,
                    boxShadow: 2
                  }}>
                    {report.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {report.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {report.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Main Report Content */}
        <Card sx={{ borderRadius: 3, boxShadow: 3, minHeight: 400 }}>
          {loading && (
            <Box sx={{ p: 4 }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
              <Skeleton variant="text" height={30} />
            </Box>
          )}

          {!loading && (
            <Box ref={componentRef}>
              <TabPanel value={tabValue} index={0}>
                <IncomeStatementReport data={reports.incomeStatement} ref={incomeStatementRef} />
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <BalanceSheetReport data={reports.balanceSheet} ref={balanceSheetRef} />
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                <CashFlowReport data={reports.cashFlow} ref={cashFlowRef} />
              </TabPanel>
              <TabPanel value={tabValue} index={3}>
                <TrialBalanceReport data={reports.trialBalance} ref={trialBalanceRef} />
              </TabPanel>
            </Box>
          )}
        </Card>

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
            <CircularProgress color="inherit" size={60} />
            <Typography variant="h5">Generating PDF Report...</Typography>
            <Typography variant="body2">Please wait while we create your report</Typography>
          </Box>
        </Backdrop>
      </Box>
    </LocalizationProvider>
  );
};

const IncomeStatementReport = React.forwardRef(({ data }, ref) => {
  if (!data) return null;
  
  return (
    <Box ref={ref} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
            Income Statement
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Excellence Coaching Hub - For the period from {new Date(data.period.startDate).toLocaleDateString()} to {new Date(data.period.endDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Chip 
          icon={<TrendingUp />} 
          label={`Net Income: ${formatCurrency(data.netIncome)}`}
          color={data.netIncome >= 0 ? 'success' : 'error'}
          sx={{ fontWeight: 600, fontSize: '1rem' }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Revenue Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'success.light',
            boxShadow: 2
          }}>
            <CardContent sx={{ bgcolor: 'success.50', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.dark' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark' }}>
                  REVENUE
                </Typography>
              </Box>
            </CardContent>
            <CardContent sx={{ pt: 0 }}>
              {data.revenue?.details?.map((item, index) => (
                <Box key={`revenue-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {item.accountName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency(item.amount)}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2, borderColor: 'success.light' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Total Revenue</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(data.revenue?.total)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Expenses Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'warning.light',
            boxShadow: 2
          }}>
            <CardContent sx={{ bgcolor: 'warning.50', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDown sx={{ mr: 1, color: 'warning.dark' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                  EXPENSES
                </Typography>
              </Box>
            </CardContent>
            <CardContent sx={{ pt: 0 }}>
              {data.expenses?.details?.map((item, index) => (
                <Box key={`expense-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {item.accountName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                    {formatCurrency(item.amount)}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2, borderColor: 'warning.light' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Total Expenses</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {formatCurrency(data.expenses?.total)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Net Income Summary */}
      <Card sx={{ 
        mt: 3,
        bgcolor: 'background.paper',
        border: '2px solid',
        borderColor: 'primary.light',
        boxShadow: 3
      }}>
        <CardContent sx={{ bgcolor: 'primary.50', py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', mb: 1 }}>
                NET INCOME
              </Typography>
              {data.grossMargin !== undefined && (
                <Typography variant="body2" color="text.secondary">
                  Gross Margin: {data.grossMargin.toFixed(1)}%
                </Typography>
              )}
            </Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 700,
              color: data.netIncome >= 0 ? 'success.main' : 'error.main'
            }}>
              {formatCurrency(data.netIncome)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
});

const BalanceSheetReport = React.forwardRef(({ data }, ref) => {
  if (!data) return null;
  
  return (
    <Box ref={ref} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
            Balance Sheet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Excellence Coaching Hub - As of {new Date(data.asOfDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            icon={<AccountBalance />} 
            label={`Total Assets: ${formatCurrency(data.totalAssets)}`}
            color="primary"
            sx={{ fontWeight: 600 }}
          />
          {data.summary?.isBalanced && (
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
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'success.light',
            boxShadow: 2
          }}>
            <CardContent sx={{ bgcolor: 'success.50', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ mr: 1, color: 'success.dark' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark' }}>
                  ASSETS
                </Typography>
              </Box>
            </CardContent>
            <CardContent sx={{ pt: 0 }}>
              {data.assets?.details?.map((item, index) => (
                <Box key={`asset-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {item.accountName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.accountCode}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency(item.amount)}
                  </Typography>
                </Box>
              ))}
              
              <Divider sx={{ my: 2, borderColor: 'success.light' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>TOTAL ASSETS</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(data.totalAssets)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Liabilities Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'error.light',
            boxShadow: 2
          }}>
            <CardContent sx={{ bgcolor: 'error.50', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingDown sx={{ mr: 1, color: 'error.dark' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.dark' }}>
                  LIABILITIES
                </Typography>
              </Box>
            </CardContent>
            <CardContent sx={{ pt: 0 }}>
              {data.liabilities?.details?.map((item, index) => (
                <Box key={`liability-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {item.accountName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.accountCode}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {formatCurrency(item.amount)}
                  </Typography>
                </Box>
              ))}
              
              <Divider sx={{ my: 2, borderColor: 'error.light' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>TOTAL LIABILITIES</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {formatCurrency(data.totalLiabilities)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Equity Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'primary.light',
            boxShadow: 2
          }}>
            <CardContent sx={{ bgcolor: 'primary.50', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ mr: 1, color: 'primary.dark' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                  EQUITY
                </Typography>
              </Box>
            </CardContent>
            <CardContent sx={{ pt: 0 }}>
              {data.equity?.details?.map((item, index) => (
                <Box key={`equity-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {item.accountName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.accountCode}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(item.amount)}
                  </Typography>
                </Box>
              ))}
              
              <Divider sx={{ my: 2, borderColor: 'primary.light' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>TOTAL EQUITY</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatCurrency(data.totalEquity)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Balance Sheet Summary */}
      <Card sx={{ 
        mt: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.300',
        boxShadow: 2
      }}>
        <CardContent sx={{ bgcolor: 'grey.50', py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
            <Summarize sx={{ mr: 1 }} />
            Balance Sheet Verification
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>Total Assets</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(data.summary?.totalAssets)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>Liabilities & Equity</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {formatCurrency(data.summary?.totalLiabilitiesAndEquity)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>Status</Typography>
                <Chip 
                  label={data.summary?.isBalanced ? "✓ Balanced" : "✗ Not Balanced"}
                  color={data.summary?.isBalanced ? "success" : "error"}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Grid>
          </Grid>
          {!data.summary?.isBalanced && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Balance sheet is not balanced. Difference: {formatCurrency(data.summary?.difference || 0)}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

const CashFlowReport = React.forwardRef(({ data }, ref) => {
  if (!data) return null;
  
  return (
    <Box ref={ref} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
            Cash Flow Statement
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Excellence Coaching Hub - For the period from {new Date(data.period?.startDate).toLocaleDateString()} to {new Date(data.period?.endDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Chip 
          icon={<CurrencyExchange />} 
          label={`Net Cash Flow: ${formatCurrency(data.netCashFlow)}`}
          color={data.netCashFlow >= 0 ? 'success' : 'error'}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Cash Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'info.light',
            boxShadow: 2
          }}>
            <CardContent sx={{ bgcolor: 'info.50', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ mr: 1, color: 'info.dark' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.dark' }}>
                  Cash Summary
                </Typography>
              </Box>
            </CardContent>
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Opening Balance</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {formatCurrency(data.openingBalance)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Closing Balance</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(data.closingBalance)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2, borderColor: 'info.light' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Net Change</Typography>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 700, 
                  color: data.netCashFlow >= 0 ? 'success.main' : 'error.main' 
                }}>
                  {formatCurrency(data.netCashFlow)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cash Inflows */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'success.light',
            boxShadow: 2
          }}>
            <CardContent sx={{ bgcolor: 'success.50', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1, color: 'success.dark' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark' }}>
                  Cash Inflows
                </Typography>
              </Box>
            </CardContent>
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Total Inflows</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(data.cashMovements?.inflows || 0)}
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Cash accounts involved:
                </Typography>
                {data.cashAccounts?.map((account, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block', pl: 1, py: 0.5, color: 'text.primary' }}>
                    {account.accountCode} - {account.accountName}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cash Outflows */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'warning.light',
            boxShadow: 2
          }}>
            <CardContent sx={{ bgcolor: 'warning.50', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingDown sx={{ mr: 1, color: 'warning.dark' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                  Cash Outflows
                </Typography>
              </Box>
            </CardContent>
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Total Outflows</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {formatCurrency(data.cashMovements?.outflows || 0)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2, borderColor: 'warning.light' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Net Flow</Typography>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 700, 
                  color: (data.cashMovements?.inflows - data.cashMovements?.outflows) >= 0 ? 'success.main' : 'error.main' 
                }}>
                  {formatCurrency((data.cashMovements?.inflows || 0) - (data.cashMovements?.outflows || 0))}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reconciliation */}
      {data.reconciliation && (
        <Card sx={{ 
          mt: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'grey.300',
          boxShadow: 2
        }}>
          <CardContent sx={{ bgcolor: 'grey.50', py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
              <Summarize sx={{ mr: 1 }} />
              Cash Reconciliation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>Opening Balance</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{formatCurrency(data.reconciliation.openingBalance)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>Net Change</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{formatCurrency(data.reconciliation.netChange)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>Closing Balance</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{formatCurrency(data.reconciliation.closingBalance)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>Status</Typography>
                  <Chip 
                    label={data.reconciliation.matches ? "✓ Reconciled" : "✗ Not Reconciled"}
                    color={data.reconciliation.matches ? "success" : "error"}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
});

const TrialBalanceReport = React.forwardRef(({ data }, ref) => {
  if (!data) return null;
  
  return (
    <Box ref={ref} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
            Trial Balance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Excellence Coaching Hub - As of {new Date(data.asOfDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            icon={<Summarize />} 
            label={`Total Accounts: ${data.trialBalance?.length || 0}`}
            color="warning"
            sx={{ fontWeight: 600 }}
          />
          {data.summary?.isBalanced && (
            <Chip 
              label="Balanced"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>

      {/* Trial Balance Table */}
      <Card sx={{ mb: 3, overflow: 'hidden', bgcolor: 'background.paper', boxShadow: 2 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: 'warning.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Account Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Account Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>Debit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>Credit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.trialBalance?.map((account, index) => (
                <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell sx={{ fontWeight: 500, color: 'text.primary' }}>{account.accountCode}</TableCell>
                  <TableCell sx={{ color: 'text.primary' }}>{account.accountName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={account.accountType} 
                      size="small" 
                      color={account.accountType === 'asset' ? 'success' : account.accountType === 'liability' ? 'error' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {account.debitAmount > 0 ? (
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(account.debitAmount)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {account.creditAmount > 0 ? (
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {formatCurrency(account.creditAmount)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'warning.50', fontWeight: 700 }}>
                <TableCell colSpan={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>TOTALS</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatCurrency(data.summary?.totalDebits)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {formatCurrency(data.summary?.totalCredits)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      
      {/* Trial Balance Summary */}
      <Card sx={{ 
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.300',
        boxShadow: 2
      }}>
        <CardContent sx={{ bgcolor: 'grey.50', py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
            <Summarize sx={{ mr: 1 }} />
            Trial Balance Verification
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>Total Debits</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(data.summary?.totalDebits)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>Total Credits</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {formatCurrency(data.summary?.totalCredits)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>Balance Status</Typography>
                <Chip 
                  label={data.summary?.isBalanced ? "✓ Balanced" : "✗ Not Balanced"}
                  color={data.summary?.isBalanced ? "success" : "error"}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Grid>
          </Grid>
          {!data.summary?.isBalanced && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Trial balance is not balanced. Difference: {formatCurrency(data.summary?.difference || 0)}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

export default Reports;
