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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Container,
  Chip,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  DeleteForever,
  Warning,
  Assessment,
  Security,
  Refresh,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, handleAPIError } from '../services/api';

const AdminTools = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    journalEntries: 0,
    journalLines: 0,
    ledgerEntries: 0,
    auditTrails: 0,
    accounts: 0,
    users: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. Admin role required to view this page.
        </Alert>
      </Container>
    );
  }

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminAPI.getSystemStats();
      setStats(response.data.stats);
      
    } catch (error) {
      console.error('Fetch stats error:', error);
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    try {
      setDeleting(true);
      setError('');
      setSuccess('');
      
      const response = await adminAPI.deleteAllData();
      setSuccess(response.data.message);
      setConfirmDialog(false);
      
      // Refresh stats after deletion
      await fetchStats();
      
    } catch (error) {
      setError(handleAPIError(error));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Tools
        </Typography>
        <Typography variant="body1" color="text.secondary">
          System administration and data management tools
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* System Statistics */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Assessment sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">System Statistics</Typography>
            <Button
              startIcon={<Refresh />}
              onClick={fetchStats}
              disabled={loading}
              sx={{ ml: 'auto' }}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.primary?.main ? alpha(theme.palette.primary.main, 0.05) : 'rgba(30, 58, 138, 0.05)' }}>
                  <Typography variant="h4" color="primary.main">
                    {stats.journalEntries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Journal Entries
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.secondary?.main ? alpha(theme.palette.secondary.main, 0.05) : 'rgba(16, 185, 129, 0.05)' }}>
                  <Typography variant="h4" color="secondary.main">
                    {stats.journalLines}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Journal Lines
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.info?.main ? alpha(theme.palette.info.main, 0.05) : 'rgba(14, 165, 233, 0.05)' }}>
                  <Typography variant="h4" color="info.main">
                    {stats.ledgerEntries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ledger Entries
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.warning?.main ? alpha(theme.palette.warning.main, 0.05) : 'rgba(245, 158, 11, 0.05)' }}>
                  <Typography variant="h4" color="warning.main">
                    {stats.auditTrails}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Audit Trails
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.success?.main ? alpha(theme.palette.success.main, 0.05) : 'rgba(16, 185, 129, 0.05)' }}>
                  <Typography variant="h4" color="success.main">
                    {stats.accounts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accounts
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={{ p: 2, bgcolor: theme.palette.grey?.[500] ? alpha(theme.palette.grey[500], 0.05) : 'rgba(100, 116, 139, 0.05)' }}>
                  <Typography variant="h4" color="text.secondary">
                    {stats.users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Users
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Permanent Data Deletion */}
      <Card sx={{ 
        mb: 4, 
        border: `2px solid ${theme.palette.error.main}`,
        bgcolor: theme.palette.error?.main ? alpha(theme.palette.error.main, 0.02) : 'rgba(239, 68, 68, 0.02)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Security sx={{ mr: 2, color: 'error.main' }} />
            <Typography variant="h6" color="error.main">
              Permanent Data Deletion
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Warning sx={{ mr: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold">
                WARNING: This action is irreversible!
              </Typography>
            </Box>
            This will permanently delete ALL transaction data including:
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>All Journal Entries and Journal Lines</li>
              <li>All Ledger Entries</li>
              <li>All Audit Trails</li>
              <li>Reset all Accounting Periods</li>
              <li>Reset all Account Balances to zero</li>
            </ul>
            This action cannot be undone. Please backup your data before proceeding.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteForever />}
              onClick={() => setConfirmDialog(true)}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete All Transaction Data'}
            </Button>
            
            {stats.journalEntries === 0 && stats.journalLines === 0 && stats.ledgerEntries === 0 && (
              <Chip
                icon={<CheckCircle />}
                label="No transaction data to delete"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ mr: 2, color: 'error.main' }} />
            Confirm Permanent Deletion
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you absolutely sure you want to permanently delete all transaction data?
          </Typography>
          
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All financial data will be permanently lost.
          </Alert>

          <Typography variant="body2" color="text.secondary">
            The following data will be deleted:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>{stats.journalEntries} Journal Entries</li>
            <li>{stats.journalLines} Journal Lines</li>
            <li>{stats.ledgerEntries} Ledger Entries</li>
            <li>{stats.auditTrails} Audit Trails</li>
          </ul>
          <Typography variant="body2" color="text.secondary">
            Additionally:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>All accounting periods will be reset</li>
            <li>All account balances will be set to zero</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handlePermanentDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteForever />}
          >
            {deleting ? 'Deleting...' : 'Permanently Delete All Data'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminTools;
