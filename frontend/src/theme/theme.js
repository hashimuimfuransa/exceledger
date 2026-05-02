import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3a8a', // Deep blue
      light: '#3b82f6',
      dark: '#1e40af',
    },
    secondary: {
      main: '#10b981', // Green accent
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    accent: {
      gold: '#f59e0b', // Soft gold accent
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#1e3a8a',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1e3a8a',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1e3a8a',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1e3a8a',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#1e3a8a',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#1e3a8a',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 600,
        },
        contained: {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          boxShadow: '0 4px 6px rgba(30, 58, 138, 0.1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            boxShadow: '0 6px 8px rgba(30, 58, 138, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme;
