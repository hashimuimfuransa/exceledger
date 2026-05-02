import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const ResponsiveTable = ({ columns, data, loading, emptyMessage = 'No data available' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <div>Loading...</div>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  // Mobile view - card layout
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((row, index) => (
          <Paper
            key={index}
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            {columns.map((column) => (
              <Box key={column.field} sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {column.headerName}:
                </Typography>
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {column.renderCell ? column.renderCell(row) : row[column.field]}
                </Typography>
              </Box>
            ))}
          </Paper>
        ))}
      </Box>
    );
  }

  // Desktop/Tablet view - table layout
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.field}
                sx={{
                  fontWeight: 600,
                  backgroundColor: theme.palette.grey[50],
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  fontSize: isTablet ? '0.875rem' : '1rem',
                  padding: isTablet ? '12px 8px' : '16px',
                }}
              >
                {column.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={index}
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                '&:nth-of-type(even)': {
                  backgroundColor: theme.palette.grey[50],
                },
              }}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  sx={{
                    fontSize: isTablet ? '0.875rem' : '1rem',
                    padding: isTablet ? '12px 8px' : '16px',
                  }}
                >
                  {column.renderCell ? column.renderCell(row) : row[column.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ResponsiveTable;
