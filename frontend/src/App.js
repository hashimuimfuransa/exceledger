import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme/theme';
import ErrorBoundary from './components/ErrorBoundary';

// Components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import TransactionList from './pages/TransactionList';
import TransactionDetail from './pages/TransactionDetail';
import EditTransaction from './pages/EditTransaction';
import Reports from './pages/Reports';
import Accounts from './pages/Accounts';
import AddAccount from './pages/AddAccount';
import AccountLedger from './pages/AccountLedger';
import TrialBalance from './pages/TrialBalance';
import FinancialStatements from './pages/FinancialStatements';
import PostedTransactions from './pages/PostedTransactions';
import AdjustedEntries from './pages/AdjustedEntries';
import YearEndClosing from './pages/YearEndClosing';
import SettingsPage from './pages/Settings';
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions/posted"
                element={
                  <ProtectedRoute>
                    <PostedTransactions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions/new"
                element={
                  <ProtectedRoute>
                    <AddTransaction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditTransaction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions/:id"
                element={
                  <ProtectedRoute>
                    <TransactionDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounts"
                element={
                  <ProtectedRoute>
                    <Accounts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounts/new"
                element={
                  <ProtectedRoute>
                    <AddAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounts/:id/ledger"
                element={
                  <ProtectedRoute>
                    <AccountLedger />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/trial-balance"
                element={
                  <ProtectedRoute>
                    <TrialBalance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/financial-statements"
                element={
                  <ProtectedRoute>
                    <FinancialStatements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/adjusted-entries"
                element={
                  <ProtectedRoute>
                    <AdjustedEntries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/year-end-closing"
                element={
                  <ProtectedRoute>
                    <YearEndClosing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
