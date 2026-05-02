import React from 'react';
import {
  Button,
  CircularProgress,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const LoadingButton = ({
  children,
  loading,
  disabled,
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  startIcon,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Button
      variant={variant}
      size={isMobile ? 'small' : size}
      fullWidth={fullWidth || isMobile}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      sx={{
        minHeight: isMobile ? 40 : 48,
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: isMobile ? 'none' : 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
        '&.Mui-disabled': {
          backgroundColor: loading ? 'primary.main' : undefined,
          color: loading ? 'white' : undefined,
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default LoadingButton;
