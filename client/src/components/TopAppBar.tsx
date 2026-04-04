import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Avatar,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { useUserContext } from '../context/UserContext';
import { usePeriodContext } from '../context/PeriodContext';
import { periodKeyToLabel } from '../utils/dates';

export default function TopAppBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedUser } = useUserContext();
  const { periodKey, setPeriodKey } = usePeriodContext();

  const [periodAnchor, setPeriodAnchor] = useState<null | HTMLElement>(null);
  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);

  // Build list: current month + 3 past months
  const now = new Date();
  const periodOptions: string[] = [];
  for (let i = 0; i < 4; i++) {
    periodOptions.push(format(subMonths(now, i), 'yyyy-MM'));
  }

  const currentTab = location.pathname === '/group' ? 1 : 0;

  const handleTabChange = (_: React.SyntheticEvent, val: number) => {
    navigate(val === 0 ? '/dashboard' : '/group');
  };

  const handleSelectPeriod = (pk: string) => {
    setPeriodKey(pk);
    setPeriodAnchor(null);
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
        {/* User avatar — clickable */}
        {selectedUser && (
          <Box>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: selectedUser.avatar_color,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 0.85 },
              }}
              onClick={(e) => setUserAnchor(e.currentTarget)}
            >
              {selectedUser.display_name[0].toUpperCase()}
            </Avatar>

            {/* User popover */}
            <Popover
              open={Boolean(userAnchor)}
              anchorEl={userAnchor}
              onClose={() => setUserAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  minWidth: 180,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                },
              }}
            >
              <Box px={2} py={1.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Signed in as
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {selectedUser.display_name}
                </Typography>
              </Box>
              <Divider />
              <List disablePadding dense>
                <ListItemButton
                  onClick={() => {
                    setUserAnchor(null);
                    navigate('/');
                  }}
                  sx={{ py: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SwitchAccountIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Switch user" />
                </ListItemButton>
              </List>
            </Popover>
          </Box>
        )}

        {/* Name — hidden on xs */}
        {selectedUser && (
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{
              display: { xs: 'none', sm: 'block' },
              color: 'text.primary',
            }}
          >
            {selectedUser.display_name}
          </Typography>
        )}

        <Box flex={1} />

        {/* Period selector as Button */}
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => setPeriodAnchor(e.currentTarget)}
          sx={{
            borderColor: 'divider',
            color: 'text.primary',
            fontWeight: 600,
            fontSize: '0.8rem',
            px: { xs: 1, sm: 1.5 },
            minWidth: 0,
            gap: 0.5,
          }}
        >
          <CalendarMonthIcon sx={{ fontSize: 16, display: { xs: 'block', sm: 'none' } }} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            <CalendarMonthIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
            {periodKeyToLabel(periodKey)}
            <KeyboardArrowDownIcon sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
          </Box>
        </Button>

        <Menu
          open={Boolean(periodAnchor)}
          anchorEl={periodAnchor}
          onClose={() => setPeriodAnchor(null)}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 160 } }}
        >
          {periodOptions.map((pk) => (
            <MenuItem
              key={pk}
              selected={pk === periodKey}
              onClick={() => handleSelectPeriod(pk)}
              sx={{ fontWeight: pk === periodKey ? 700 : 400 }}
            >
              {periodKeyToLabel(pk)}
            </MenuItem>
          ))}
        </Menu>

        {/* View toggle */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: '#5C6BC0' } }}
          sx={{ minHeight: 0 }}
        >
          <Tab
            label="Personal"
            sx={{
              minHeight: 0,
              py: 1,
              fontSize: 13,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
            }}
          />
          <Tab
            label="Group"
            sx={{
              minHeight: 0,
              py: 1,
              fontSize: 13,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
            }}
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}
