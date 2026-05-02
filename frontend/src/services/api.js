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
