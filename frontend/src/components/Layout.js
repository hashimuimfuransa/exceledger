import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  alpha,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Receipt,
  Assessment,
  AccountBalance,
  Person,
  Logout,
  PostAdd,
  Lock,
  Settings,
  Group,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const getMenuItems = (user) => {
  const items = [
    { text: 'Dashboard', icon: Dashboard, path: '/dashboard' },
    { text: 'Transactions', icon: Receipt, path: '/transactions' },
    { text: 'Posted Transactions', icon: AccountBalance, path: '/transactions/posted' },
    { text: 'Add Transaction', icon: AccountBalance, path: '/transactions/new' },
    { text: 'Reports', icon: Assessment, path: '/reports' },
    { text: 'Adjusted Entries', icon: PostAdd, path: '/accounting/adjusted-entries' },
    { text: 'Year-End Closing', icon: Lock, path: '/accounting/year-end-closing' },
  ];
  
  // Add admin-only menu items
  if (user && user.role === 'admin') {
    items.push({ text: 'User Management', icon: Group, path: '/admin/users' });
  }
  
  items.push({ text: 'Settings', icon: Settings, path: '/settings' });
  
  return items;
};

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ 
      height: '100%',
      background: `
        linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%),
        linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)
      `,
    }}>
      <Toolbar sx={{ 
        background: `
          linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)
        `,
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${theme.palette.secondary.main}, transparent)`,
        },
      }}>
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            color: 'white',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.2)}`,
          }}
        >
          ExceLedger
        </Typography>
      </Toolbar>
      <Divider sx={{ 
        borderColor: alpha(theme.palette.divider, 0.1),
        boxShadow: `0 1px 0 ${alpha(theme.palette.common.white, 0.1)}`,
      }} />
      <List sx={{ p: 2 }}>
        {getMenuItems(user).map((item, index) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              mb: 1,
              borderRadius: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: location.pathname === item.path 
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.main, 0.05)})`
                  : 'transparent',
                opacity: location.pathname === item.path ? 1 : 0,
                transition: 'opacity 0.3s ease',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                color: theme.palette.primary.main,
                fontWeight: 600,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                transform: 'translateX(4px)',
                '&::before': {
                  opacity: 0.5,
                },
              },
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: location.pathname === item.path ? 'inherit' : alpha(theme.palette.text.primary, 0.7),
            }}>
              <item.icon />
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.875rem',
                  fontWeight: location.pathname === item.path ? 600 : 500,
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: `
            linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.95)} 100%)
          `,
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        }}
      >
        <Toolbar>
          <Tooltip title="Toggle menu">
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { md: 'none' },
                backgroundColor: alpha(theme.palette.common.white, 0.1),
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.2),
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'white',
              textShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.1)}`,
            }}
          >
            {getMenuItems(user).find(item => item.path === location.pathname)?.text || 'ExceLedger'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Profile">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ 
                  p: 0.5,
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.common.white, 0.2),
                  },
                }}
              >
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.secondary.main, 0.8),
                  width: 36,
                  height: 36,
                  fontWeight: 600,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.2)}`,
                }}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              onClick={handleProfileMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: `drop-shadow(0px 8px 24px ${alpha(theme.palette.common.black, 0.15)})`,
                  mt: 1.5,
                  minWidth: 200,
                  background: `
                    linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.background.paper, 0.95)})
                  `,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 2,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '& .MuiListItem-root': {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem sx={{ py: 1.5 }}>
                <Person sx={{ mr: 1.5, color: theme.palette.text.secondary }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.role}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem 
                onClick={handleLogout}
                sx={{ 
                  py: 1.5,
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.04),
                  },
                }}
              >
                <Logout sx={{ mr: 1.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Logout
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
