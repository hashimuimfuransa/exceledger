import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  Receipt,
  Assessment,
  AccountBalance,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = ({ onItemClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: Dashboard, path: '/dashboard' },
    { text: 'Transactions', icon: Receipt, path: '/transactions' },
    { text: 'Add Transaction', icon: AccountBalance, path: '/transactions/new' },
    { text: 'Accounts', icon: AccountBalanceWallet, path: '/accounts' },
    { text: 'Reports', icon: Assessment, path: '/reports' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <List>
      {menuItems.map((item) => (
        <ListItem
          button
          key={item.text}
          onClick={() => handleNavigation(item.path)}
          selected={location.pathname === item.path}
          sx={{
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon><item.icon /></ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </List>
  );
};

export default Navigation;
