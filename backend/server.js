const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const templateRoutes = require('./routes/templateRoutes');
const journalRoutes = require('./routes/journalRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const trialBalanceRoutes = require('./routes/trialBalanceRoutes');
const financialStatementsRoutes = require('./routes/financialStatementsRoutes');
const accountingCycleRoutes = require('./routes/accountingCycleRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'ExceLedger API Server' });
});

app.use('/api/journal', journalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/trial-balance', trialBalanceRoutes);
app.use('/api/reports', financialStatementsRoutes);
app.use('/api/accounting-cycle', accountingCycleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
