import axios from 'axios';

// Set base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Auth API
export const authAPI = {
  login: (credentials) => axios.post('/auth/login', credentials),
  getProfile: () => axios.get('/auth/profile'),
};

// Accounts API
export const accountsAPI = {
  getAll: (params) => axios.get('/accounts', { params }),
  getById: (id) => axios.get(`/accounts/${id}`),
  create: (data) => axios.post('/accounts', data),
  update: (id, data) => axios.put(`/accounts/${id}`, data),
  delete: (id) => axios.delete(`/accounts/${id}`),
  getByType: (type) => axios.get(`/accounts/type/${type}`),
};

// Templates API
export const templatesAPI = {
  getAll: (params) => axios.get('/templates', { params }),
  getById: (id) => axios.get(`/templates/${id}`),
  create: (data) => axios.post('/templates', data),
  update: (id, data) => axios.put(`/templates/${id}`, data),
  delete: (id) => axios.delete(`/templates/${id}`),
  getByCategory: (category) => axios.get(`/templates/category/${category}`),
};

// Journal Entries API
export const journalAPI = {
  getAll: (params) => axios.get('/journal', { params }),
  getById: (id) => axios.get(`/journal/${id}`),
  create: (data) => axios.post('/journal', data),
  update: (id, data) => axios.put(`/journal/${id}`, data),
  delete: (id) => axios.delete(`/journal/${id}`),
  postEntry: (id) => axios.post(`/journal/${id}/post`),
};

// Ledger API
export const ledgerAPI = {
  getByAccount: (accountId, params) => axios.get(`/ledger/account/${accountId}`, { params }),
  getGeneral: (params) => axios.get('/ledger/general', { params }),
  getBalance: (accountId, params) => axios.get(`/ledger/balance/${accountId}`, { params }),
  postToLedger: (entryId) => axios.post(`/ledger/entry/${entryId}/post`),
};

// Trial Balance API
export const trialBalanceAPI = {
  generate: (params) => axios.get('/trial-balance', { params }),
  getByType: (accountType, params) => axios.get(`/trial-balance/type/${accountType}`, { params }),
  getSummary: (params) => axios.get('/trial-balance/summary', { params }),
  validate: (params) => axios.get('/trial-balance/validate', { params }),
};

// Reports API
export const reportsAPI = {
  getIncomeStatement: (params) => axios.get('/reports/income-statement', { params }),
  getBalanceSheet: (params) => axios.get('/reports/balance-sheet', { params }),
  getCashFlow: (params) => axios.get('/reports/cash-flow', { params }),
  getGeneralJournal: (params) => axios.get('/reports/general-journal', { params }),
  getSummary: (params) => axios.get('/reports/summary', { params }),
};

// Accounting Cycle API
export const accountingCycleAPI = {
  // Adjusted Entries
  createAdjustedEntry: (data) => axios.post('/accounting-cycle/adjusted-entries', data),
  getAdjustedEntries: (params) => axios.get('/accounting-cycle/adjusted-entries', { params }),
  approveAdjustedEntry: (entryId) => axios.post(`/accounting-cycle/adjusted-entries/${entryId}/approve`),
  createReversingEntry: (data) => axios.post('/accounting-cycle/reversing-entries', data),
  
  // Year-End Closing
  performYearEndClosing: (data) => axios.post('/accounting-cycle/year-end-closing', data),
  getClosingEntries: (params) => axios.get('/accounting-cycle/closing-entries', { params }),
  
  // New Year Opening
  openNewYear: (data) => axios.post('/accounting-cycle/open-new-year', data),
};

// Settings API
export const settingsAPI = {
  getSettings: () => axios.get('/settings'),
  updateSettings: (data) => axios.put('/settings', data),
};

// Users API
export const usersAPI = {
  getAll: (params) => axios.get('/users', { params }),
  getById: (id) => axios.get(`/users/${id}`),
  create: (data) => axios.post('/users', data),
  update: (id, data) => axios.put(`/users/${id}`, data),
  delete: (id) => axios.delete(`/users/${id}`),
  toggleStatus: (id) => axios.patch(`/users/${id}/toggle-status`),
};

// Utility function to handle API errors
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.message || 'Server error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};
