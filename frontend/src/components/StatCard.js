import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  trendValue,
  format = 'currency',
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const formatValue = (val) => {
    if (format === 'currency') {
      return `Frw ${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val || 0)}`;
    } else if (format === 'percentage') {
      return `${(val || 0).toFixed(1)}%`;
    } else if (format === 'number') {
      return new Intl.NumberFormat('en-US').format(val || 0);
    }
    return val || 0;
  };

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp />;
    if (trend < 0) return <TrendingDown />;
    return <TrendingFlat />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'success.main';
    if (trend < 0) return 'error.main';
    return 'text.secondary';
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.15)}`,
        borderRadius: 3,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${theme.palette[color].main}, ${alpha(theme.palette[color].main, 0.6)})`,
        },
        '&:hover': {
          transform: isMobile ? 'scale(1.02)' : 'translateY(-6px) scale(1.02)',
          boxShadow: `0 20px 40px ${alpha(theme.palette[color].main, 0.15)}`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.3)}`,
          '&::before': {
            height: '6px',
          },
        },
        ...props.sx,
      }}
      {...props}
    >
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          {icon ? (
            <Box
              sx={{
                p: isMobile ? 1.2 : 1.5,
                borderRadius: 2.5,
                bgcolor: `${color}.main`,
                color: 'white',
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette[color].main, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: `0 6px 16px ${alpha(theme.palette[color].main, 0.4)}`,
                },
              }}
            >
              {React.createElement(icon, { sx: { fontSize: isMobile ? 20 : 24 } })}
            </Box>
          ) : null}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant={isMobile ? 'body2' : 'body1'}
              color="text.secondary"
              gutterBottom
              noWrap
            >
              {title}
            </Typography>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="div"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                fontSize: isMobile ? '1.5rem' : '2rem',
                lineHeight: 1.2,
              }}
            >
              {formatValue(value)}
            </Typography>
            {subtitle ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Box>
        
        {trend !== undefined ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 2,
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(getTrendColor() === 'success.main' ? theme.palette.success.main : 
                          getTrendColor() === 'error.main' ? theme.palette.error.main : 
                          theme.palette.text.secondary, 0.08),
              border: `1px solid ${alpha(getTrendColor() === 'success.main' ? theme.palette.success.main : 
                                      getTrendColor() === 'error.main' ? theme.palette.error.main : 
                                      theme.palette.text.secondary, 0.2)}`,
            }}
          >
            <Box 
              sx={{ 
                color: getTrendColor(), 
                display: 'flex', 
                alignItems: 'center',
                fontSize: isMobile ? 16 : 20,
              }}
            >
              {getTrendIcon()}
            </Box>
            <Typography
              variant={isMobile ? 'caption' : 'body2'}
              sx={{ 
                color: getTrendColor(),
                fontWeight: 500,
              }}
            >
              {trendValue !== undefined ? formatValue(trendValue) : formatValue(Math.abs(trend))}
              {format === 'percentage' && ' from last period'}
            </Typography>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default StatCard;
