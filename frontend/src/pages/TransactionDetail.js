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
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Send,
  AccountBalance,
  Assessment,
  TrendingUp,
  TrendingDown,
  AttachFile,
  Download
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { journalAPI } from '../services/api';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await journalAPI.getById(id);
        setTransaction(response.data.entry);
      } catch (err) {
        setError('Failed to load transaction details');
        console.error('Transaction detail error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/transactions/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await journalAPI.delete(id);
        navigate('/transactions');
      } catch (err) {
        setError('Failed to delete transaction');
        console.error('Delete transaction error:', err);
      }
    }
  };

  const handlePost = async () => {
    try {
      await journalAPI.postEntry(id);
      setTransaction(prev => ({ ...prev, status: 'posted' }));
    } catch (err) {
      setError('Failed to post transaction');
      console.error('Post transaction error:', err);
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

  if (!transaction) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Transaction not found
      </Alert>
    );
  }

  const debitTotal = (transaction.lines || [])
    .reduce((sum, line) => sum + (line.debitAmount || 0), 0);
  const creditTotal = (transaction.lines || [])
    .reduce((sum, line) => sum + (line.creditAmount || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/transactions')}
          sx={{ mr: 2 }}
        >
          Back to Transactions
        </Button>
        <Typography variant="h4">
          Transaction Details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {transaction.entryNumber}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {transaction.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip
                      label={transaction.status}
                      color={getStatusColor(transaction.status)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Date: {new Date(transaction.entryDate).toLocaleDateString()}
                    </Typography>
                    {transaction.referenceNumber && (
                      <Typography variant="body2" color="text.secondary">
                        Ref: {transaction.referenceNumber}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {transaction.status === 'draft' && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                        size="small"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Send />}
                        onClick={handlePost}
                        color="success"
                        size="small"
                      >
                        Post
                      </Button>
                    </>
                  )}
                  {transaction.status === 'draft' && (
                    <Button
                      variant="outlined"
                      startIcon={<Delete />}
                      onClick={handleDelete}
                      color="error"
                      size="small"
                    >
                      Delete
                    </Button>
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Journal Entries
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Debit</TableCell>
                      <TableCell align="right">Credit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(transaction.lines || []).map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {line.account && getAccountIcon(line.account.accountType)}
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  cursor: transaction.status === 'posted' ? 'pointer' : 'default',
                                  '&:hover': transaction.status === 'posted' ? {
                                    textDecoration: 'underline',
                                    color: 'primary.main'
                                  } : {}
                                }}
                                onClick={() => transaction.status === 'posted' && navigate(`/accounts/${line.account._id}/ledger`)}
                              >
                                {line.account?.accountCode}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {line.account?.accountName}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {line.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {line.debitAmount > 0 ? (
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Frw {line.debitAmount.toLocaleString()}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {line.creditAmount > 0 ? (
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Frw {line.creditAmount.toLocaleString()}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                        Totals
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Frw {debitTotal.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Frw {creditTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {transaction.paymentProof && (
                <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <AttachFile color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Payment Proof
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      File: {transaction.paymentProofFileName || 'payment_proof'}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Download />}
                      href={transaction.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textTransform: 'none' }}
                    >
                      View/Download
                    </Button>
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: debitTotal === creditTotal ? 'success.main' : 'error.main'
                  }}
                >
                  {debitTotal === creditTotal ? '✓ Balanced' : '⚠ Not Balanced'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {transaction.status === 'draft' && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={handleEdit}
                      fullWidth
                    >
                      Edit Transaction
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Send />}
                      onClick={handlePost}
                      color="success"
                      fullWidth
                    >
                      Post Transaction
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Delete />}
                      onClick={handleDelete}
                      color="error"
                      fullWidth
                    >
                      Delete Transaction
                    </Button>
                  </>
                )}
                {transaction.status === 'posted' && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<Assessment />}
                      onClick={() => navigate('/reports/trial-balance')}
                      fullWidth
                    >
                      View Trial Balance
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AccountBalance />}
                      onClick={() => navigate('/reports/financial-statements')}
                      fullWidth
                    >
                      Financial Statements
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      onClick={() => navigate('/transactions')}
                      fullWidth
                    >
                      Back to List
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Transaction Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Entry Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {transaction.entryNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Frw {debitTotal.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Number of Lines
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {(transaction.lines || []).length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransactionDetail;
