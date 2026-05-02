import React from 'react';
import { Grid, useTheme, useMediaQuery } from '@mui/material';

const ResponsiveGrid = ({ children, spacing = 3, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Grid
      container
      spacing={isMobile ? 2 : spacing}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!child) return null;
        
        // Auto-adjust grid item sizes for responsive design
        let gridProps = child.props;
        
        if (!gridProps.xs && !gridProps.sm && !gridProps.md && !gridProps.lg && !gridProps.xl) {
          // Default responsive behavior if no breakpoints are specified
          gridProps = {
            ...gridProps,
            xs: 12,
            sm: isTablet ? 12 : 6,
            md: 6,
            lg: 4,
            xl: 3,
          };
        }

        return React.cloneElement(child, gridProps);
      })}
    </Grid>
  );
};

export default ResponsiveGrid;
