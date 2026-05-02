# ExceLedger - Financial Management System

A production-ready financial management web application for Excellence Coaching Hub.

## Tech Stack

- **Frontend**: React.js + Material UI
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT

## Features

- Double-entry accounting system
- Transaction templates for fast data entry
- Chart of accounts management
- Financial statements (Income Statement, Balance Sheet, Cash Flow)
- Trial balance generation
- Role-based access control (Admin/User)
- Mobile-first responsive design

## Project Structure

```
excefinance/
├── backend/
│   ├── config/       # Configuration files
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Custom middleware
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
└── frontend/
    └── src/
        ├── components/  # Reusable components
        ├── contexts/    # React contexts
        ├── hooks/       # Custom hooks
        ├── layouts/     # Page layouts
        ├── pages/       # Page components
        ├── services/    # API services
        ├── theme/       # Material UI theme
        └── utils/       # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Configure environment variables:
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   
   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with your API URL
   ```
5. Start MongoDB:
   ```bash
   # For Windows with MongoDB installed as service
   net start MongoDB
   
   # Or run MongoDB manually
   mongod
   ```
6. Seed the database with initial data:
   ```bash
   cd backend
   node scripts/seed.js
   ```
7. Run backend:
   ```bash
   cd backend
   npm start
   ```
8. Run frontend:
   ```bash
   cd frontend
   npm start
   ```

### Login Credentials

After seeding the database, you can login with these accounts:

**Password for all accounts: `ECH.Info@12345`**

**Admin Accounts:**
- Email: `admin@excellencecoaching.com` (Administrator)
- Email: `sauda@excellencecoaching.com` (Sauda Usanase)
- Email: `john@excellencecoaching.com` (John Coach)
- Email: `sarah@excellencecoaching.com` (Sarah Manager)

**User Accounts:**
- Email: `mike@excellencecoaching.com` (Mike User)
- Email: `lisa@excellencecoaching.com` (Lisa Viewer)

## License

Proprietary - Excellence Coaching Hub
