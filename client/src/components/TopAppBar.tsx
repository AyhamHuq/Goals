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
  IconButton,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { usePeriodContext } from '../context/PeriodContext';
import { formatDayLabel, formatDayLabelShort } from '../utils/dates';

export default function TopAppBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedUser } = useUserContext();
  const { selectedDay, isToday, goToToday, goToPreviousDay, goToNextDay } = usePeriodContext();

  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);

  const currentTab = location.pathname === '/group' ? 1 : 0;

  const handleTabChange = (_: React.SyntheticEvent, val: number) => {
    navigate(val === 0 ? '/dashboard' : '/group');
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 }, pt: 'env(safe-area-inset-top, 0px)' }}>
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

        {/* Day navigator */}
        <Box display="flex" alignItems="center" gap={0}>
          <IconButton onClick={goToPreviousDay} sx={{ color: 'text.primary', minWidth: 44, minHeight: 44 }}>
            <ChevronLeftIcon />
          </IconButton>

          <Button
            variant="text"
            onClick={!isToday ? goToToday : undefined}
            disableRipple={isToday}
            sx={{
              color: isToday ? 'text.primary' : 'warning.main',
              fontWeight: 700,
              fontSize: '0.85rem',
              minWidth: { xs: 80, sm: 140 },
              textTransform: 'none',
              px: 0.5,
              cursor: isToday ? 'default' : 'pointer',
              '&:hover': { bgcolor: isToday ? 'transparent' : undefined },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {formatDayLabel(selectedDay)}
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              {formatDayLabelShort(selectedDay)}
            </Box>
          </Button>

          <IconButton
            onClick={goToNextDay}
            disabled={isToday}
            sx={{ color: 'text.primary', minWidth: 44, minHeight: 44 }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

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
