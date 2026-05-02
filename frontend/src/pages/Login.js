import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Fade,
  Paper,
  IconButton,
} from '@mui/material';
import {
  LockOutlined,
  EmailOutlined,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, clearError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const handleChange = (field) => (e) => {
    if (error) clearError();
    if (field === 'email') setEmail(e.target.value);
    if (field === 'password') setPassword(e.target.value);
  };

  return (
    <Fade in timeout={1000}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Paper
          elevation={24}
          sx={{
            maxWidth: 420,
            width: '100%',
            borderRadius: 4,
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.05)',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.15), 0 15px 30px rgba(0,0,0,0.08)',
            },
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                src="/logo.png"
                alt="ExceLedger Logo"
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  border: '3px solid #fff',
                }}
              />
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 1,
                }}
              >
                ExceLedger
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ fontWeight: 500, mb: 1 }}
              >
                Financial Management System
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ opacity: 0.8 }}
              >
                Excellence Coaching Hub
              </Typography>
            </Box>

          {error ? (
            <Fade in timeout={300}>
              <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
                {error}
              </Alert>
            </Fade>
          ) : null}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={handleChange('email')}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              InputProps={{
                startAdornment: <EmailOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)',
                  },
                },
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handleChange('password')}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: <LockOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ mr: 1 }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)',
                  },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3, mb: 2 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ opacity: 0.7 }}
            >
              © 2024 Excellence Coaching Hub
            </Typography>
          </Box>
          </CardContent>
        </Paper>
      </Box>
    </Fade>
  );
};

export default Login;
