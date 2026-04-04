import React from 'react';
import {
  AppBar,
  Toolbar,
  Avatar,
  Typography,
  Select,
  MenuItem,
  Box,
  Tabs,
  Tab,
  FormControl,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, subMonths, parse } from 'date-fns';
import { useUserContext } from '../context/UserContext';
import { usePeriodContext } from '../context/PeriodContext';
import { periodKeyToLabel } from '../utils/dates';

export default function TopAppBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedUser } = useUserContext();
  const { periodKey, setPeriodKey } = usePeriodContext();

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

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        {/* User avatar + name */}
        {selectedUser && (
          <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: selectedUser.avatar_color,
                fontSize: 14,
              }}
            >
              {selectedUser.display_name[0].toUpperCase()}
            </Avatar>
            <Typography variant="body1" fontWeight={600} noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
              {selectedUser.display_name}
            </Typography>
          </Box>
        )}

        {/* Spacer */}
        <Box flex={1} />

        {/* Period selector */}
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
            variant="outlined"
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
              '.MuiSvgIcon-root': { color: 'white' },
              fontSize: 14,
            }}
          >
            {periodOptions.map((pk) => (
              <MenuItem key={pk} value={pk}>
                {periodKeyToLabel(pk)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* View toggle */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: 'white' } }}
          sx={{ minHeight: 0 }}
        >
          <Tab label="Personal" sx={{ minHeight: 0, py: 1, fontSize: 13 }} />
          <Tab label="Group" sx={{ minHeight: 0, py: 1, fontSize: 13 }} />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}
