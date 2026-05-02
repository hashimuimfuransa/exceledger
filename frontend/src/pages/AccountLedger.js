import React, { useState, useEffect, useRef } from 'react';
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
  IconButton,
  Tooltip,
  Backdrop,
} from '@mui/material';
import { 
  ArrowBack, 
  Download,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  PictureAsPdf,
  Print,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ledgerAPI, accountsAPI } from '../services/api';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AccountLedger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ledgerData, setLedgerData] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: new Date(),
  });
  const ledgerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await ledgerAPI.getByAccount(id, {
          startDate: filters.startDate?.toISOString().split('T')[0],
          endDate: filters.endDate?.toISOString().split('T')[0],
        });
        
        setLedgerData(response.data);
        setAccount(response.data.account);
      } catch (err) {
        setError('Failed to load ledger data');
        console.error('Ledger error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, filters]);

  const handleFilterChange = (field) => (value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getAccountIcon = (accountType) => {
    switch (accountType) {
      case 'asset':
        return <AccountBalance sx={{ color: 'success.main' }} />;
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

  const formatCurrency = (amount) => {
    return `Frw ${Math.abs(amount).toLocaleString()}`;
  };

  const getRunningBalance = (transactions, index) => {
    return transactions.slice(0, index + 1).reduce((balance, transaction) => {
      if (transaction.debitAmount > 0) {
        return balance - transaction.debitAmount;
      } else {
        return balance + transaction.creditAmount;
      }
    }, 0);
  };

  const handlePrint = useReactToPrint({
    content: () => ledgerRef.current,
    documentTitle: `Account_Ledger_${account?.accountCode}_${new Date().toISOString().split('T')[0]}`,
  });

  const handlePDFDownload = async () => {
    setIsExporting(true);
    try {
      const element = ledgerRef.current;
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

      const fileName = `Account_Ledger_${account?.accountCode}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

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

  if (!account || !ledgerData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Account not found
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/accounts')}
            sx={{ mr: 2 }}
          >
            Back to Accounts
          </Button>
          <Typography variant="h4">
            Account Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Excellence Coaching Hub
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Account Information */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              {getAccountIcon(account.accountType)}
              <Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {account.accountCode} - {account.accountName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip
                    label={account.accountType}
                    color="primary"
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Normal Balance: {account.normalBalance}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Date Filters
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={handleFilterChange('startDate')}
                slots={{ textField: TextField }}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={handleFilterChange('endDate')}
                slots={{ textField: TextField }}
                slotProps={{ textField: { size: 'small' } }}
              />
              <Button
                variant="outlined"
                onClick={() => setFilters({ startDate: null, endDate: new Date() })}
              >
                Clear Filters
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Balance Summary */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Balance Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Opening Balance
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatCurrency(ledgerData.openingBalance || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Debits
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {formatCurrency(ledgerData.totalDebits || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Credits
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(ledgerData.totalCredits || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Closing Balance
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatCurrency(ledgerData.closingBalance || 0)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Ledger Transactions */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Ledger Transactions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Export as PDF">
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdf />}
                    size="small"
                    onClick={handlePDFDownload}
                    disabled={isExporting}
                  >
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                  </Button>
                </Tooltip>
                <Tooltip title="Print">
                  <IconButton onClick={handlePrint} size="small">
                    <Print />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box ref={ledgerRef}>
              <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  Excellence Coaching Hub
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  Account Ledger
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {account?.accountCode} - {account?.accountName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Period: {filters.startDate?.toLocaleDateString() || 'Beginning'} to {filters.endDate?.toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Balance Summary</Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Opening Balance</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(ledgerData.openingBalance || 0)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Debits</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {formatCurrency(ledgerData.totalDebits || 0)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Credits</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(ledgerData.totalCredits || 0)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Closing Balance</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(ledgerData.closingBalance || 0)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledgerData.ledgerEntries?.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(transaction.entryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {transaction.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {transaction.journalEntry?.entryNumber || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.journalEntry?.referenceNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {transaction.debitAmount > 0 ? (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                            {formatCurrency(transaction.debitAmount)}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {transaction.creditAmount > 0 ? (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {formatCurrency(transaction.creditAmount)}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(getRunningBalance(ledgerData.ledgerEntries, index))}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!ledgerData.ledgerEntries || ledgerData.ledgerEntries.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No transactions found for this period
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Export Backdrop */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isExporting}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" size={60} />
            <Typography variant="h5">Generating PDF Ledger...</Typography>
            <Typography variant="body2">Please wait while we create your ledger report</Typography>
          </Box>
        </Backdrop>
      </Box>
    </LocalizationProvider>
  );
};

export default AccountLedger;
