import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';

const ResponsiveCard = ({ children, title, subtitle, actions, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Card
      sx={{
        width: '100%',
        height: isMobile ? 'auto' : '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: 3,
        background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.6)})`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover': {
          transform: isMobile ? 'scale(1.01)' : 'translateY(-6px) scale(1.01)',
          boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          '&::before': {
            opacity: 1,
          },
        },
        ...props.sx,
      }}
      {...props}
    >
      {(title || subtitle) ? (
        <CardContent sx={{ pb: subtitle ? 1 : 2 }}>
          {title && (
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.8)})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ 
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 500,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </CardContent>
      ) : null}
      
      <CardContent sx={{ flex: 1, pt: title || subtitle ? 0 : 2 }}>
        {children}
      </CardContent>
      
      {actions && (
        <CardActions
          sx={{
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1.5 : 1,
            p: isMobile ? 2 : 3,
            pt: 0,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            mt: 'auto',
          }}
        >
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default ResponsiveCard;
