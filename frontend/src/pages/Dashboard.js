import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  useMediaQuery,
  Container,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Add,
  Assessment,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, journalAPI } from '../services/api';
import StatCard from '../components/StatCard';
import ResponsiveCard from '../components/ResponsiveCard';
import ResponsiveGrid from '../components/ResponsiveGrid';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch financial summary
        const summaryResponse = await reportsAPI.getSummary({ period: 'monthly' });
        setSummary(summaryResponse.data.summary);

        // Fetch recent transactions
        const transactionsResponse = await journalAPI.getAll({ page: 1, limit: 5 });
        setRecentTransactions(transactionsResponse.data.entries || []);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  return (
    <Container 
      maxWidth={false}
      sx={{ 
        p: isMobile ? 2 : 3,
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        minHeight: '100vh',
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        mb: 4,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0,
      }}>
        <Box>
          <Typography 
            variant={isMobile ? 'h4' : 'h3'} 
            component="h1"
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 1,
            }}
          >
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Welcome back, {user?.fullName}
          </Typography>
        </Box>
        <Box sx={{
          p: 2,
          borderRadius: 3,
          background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.05)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          <Typography variant="caption" color="text.secondary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
      </Box>

      {summary ? (
        <ResponsiveGrid sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={summary.totalRevenue || 0}
              icon={TrendingUp}
              color="success"
              trend={15.3}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Expenses"
              value={summary.totalExpenses || 0}
              icon={TrendingDown}
              color="error"
              trend={-8.2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Net Profit"
              value={summary.netIncome || 0}
              icon={AccountBalance}
              color="primary"
              trend={23.7}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Cash on Hand"
              value={summary.totalCash || 0}
              icon={Receipt}
              color="warning"
              trend={5.1}
            />
          </Grid>
        </ResponsiveGrid>
      ) : null}

      <ResponsiveGrid>
        <Grid item xs={12} md={8}>
          <ResponsiveCard title="Recent Transactions">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <Box
                  key={transaction._id}
                  sx={{
                    py: isMobile ? 1.5 : 2,
                    px: isMobile ? 1 : 0,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    '&:last-child': { borderBottom: 'none' },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 1 : 0,
                  }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant={isMobile ? 'body2' : 'subtitle1'}
                        sx={{ 
                          fontWeight: 600,
                          color: 'primary.main',
                          mb: 0.5,
                        }}
                      >
                        {transaction.entryNumber}
                      </Typography>
                      <Typography 
                        variant={isMobile ? 'caption' : 'body2'} 
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {transaction.description}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      textAlign: isMobile ? 'left' : 'right',
                      minWidth: isMobile ? 'auto' : 120,
                    }}>
                      <Typography 
                        variant={isMobile ? 'body2' : 'subtitle2'}
                        sx={{ 
                          fontWeight: 700,
                          color: 'text.primary',
                          mb: 0.25,
                        }}
                      >
                        Frw {transaction.totalDebit.toLocaleString()}
                      </Typography>
                      <Typography 
                        variant={isMobile ? 'caption' : 'caption'} 
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                      >
                        {new Date(transaction.entryDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: isMobile ? undefined : 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              <Box sx={{ 
                py: 4, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}>
                <Receipt sx={{ 
                  fontSize: 48, 
                  color: alpha(theme.palette.text.secondary, 0.3) 
                }} />
                <Typography variant="body2" color="text.secondary">
                  No recent transactions
                </Typography>
              </Box>
            )}
          </ResponsiveCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <ResponsiveCard title="Quick Actions">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Add />}
                onClick={() => navigate('/transactions/new')}
                sx={{
                  py: isMobile ? 1.5 : 2,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                }}
              >
                Add Transaction
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Assessment />}
                onClick={() => navigate('/reports')}
                sx={{
                  py: isMobile ? 1.5 : 2,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}
              >
                View Reports
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AccountBalanceWallet />}
                onClick={() => navigate('/accounts')}
                sx={{
                  py: isMobile ? 1.5 : 2,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}
              >
                Manage Accounts
              </Button>
            </Box>
          </ResponsiveCard>
        </Grid>
      </ResponsiveGrid>
    </Container>
  );
};

export default Dashboard;
