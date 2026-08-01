import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Avatar,
  Typography,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { usePeriodContext } from '../context/PeriodContext';
import { useThemeMode } from '../context/ThemeContext';
import { formatDayLabel, formatDayLabelShort } from '../utils/dates';

export default function TopAppBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { selectedUser } = useUserContext();
  const { selectedDay, isToday, goToToday, goToPreviousDay, goToNextDay } = usePeriodContext();
  const { mode, setMode } = useThemeMode();

  const [userDrawerOpen, setUserDrawerOpen] = useState(false);

  const currentTab = location.pathname === '/group' ? 1 : 0;
  const isDark = theme.palette.mode === 'dark';

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar
        sx={{
          gap: 0.5,
          minHeight: { xs: 58, sm: 64 },
          pt: 'env(safe-area-inset-top, 0px)',
          px: { xs: 1.5, sm: 2.5 },
        }}
      >
        {/* User avatar */}
        {selectedUser && (
          <Box>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: selectedUser.avatar_color,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 0 0 2.5px ${selectedUser.avatar_color}55, 0 2px 8px ${selectedUser.avatar_color}44`,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  transform: 'scale(1.07)',
                  boxShadow: `0 0 0 3px ${selectedUser.avatar_color}66, 0 4px 12px ${selectedUser.avatar_color}55`,
                },
                '&:active': { transform: 'scale(0.94)' },
              }}
              onClick={() => setUserDrawerOpen(true)}
            >
              {selectedUser.display_name[0].toUpperCase()}
            </Avatar>

            {/* User settings bottom drawer */}
            <Drawer
              anchor="bottom"
              open={userDrawerOpen}
              onClose={() => setUserDrawerOpen(false)}
              PaperProps={{
                sx: {
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  pb: 'env(safe-area-inset-bottom, 0px)',
                },
              }}
            >
              <Box display="flex" justifyContent="center" pt={1.25} pb={0.5}>
                <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
              </Box>
              <Box px={2} py={1.5}>
                <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: selectedUser.avatar_color,
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    {selectedUser.display_name[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {selectedUser.display_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active user
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider />
              {/* Theme selector */}
              <Box px={2} py={1.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                  Appearance
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  {(['light', 'system', 'dark'] as const).map((m) => {
                    const icons = {
                      light: <LightModeIcon sx={{ fontSize: 18 }} />,
                      system: <SettingsBrightnessIcon sx={{ fontSize: 18 }} />,
                      dark: <DarkModeIcon sx={{ fontSize: 18 }} />,
                    };
                    const labels = { light: 'Light', system: 'System', dark: 'Dark' };
                    const active = mode === m;
                    return (
                      <Button
                        key={m}
                        size="small"
                        variant={active ? 'contained' : 'outlined'}
                        startIcon={icons[m]}
                        onClick={() => setMode(m)}
                        sx={{
                          flex: 1,
                          borderRadius: 2.5,
                          fontSize: '0.75rem',
                          py: 0.75,
                          ...(active ? {} : { borderColor: 'divider', color: 'text.secondary' }),
                        }}
                      >
                        {labels[m]}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
              <Divider />
              <List disablePadding sx={{ px: 1, py: 0.75 }}>
                <ListItemButton
                  onClick={() => {
                    setUserDrawerOpen(false);
                    navigate('/');
                  }}
                  sx={{ borderRadius: 2, py: 1.25 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SwitchAccountIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Switch user" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                </ListItemButton>
              </List>
              <Box sx={{ height: 8 }} />
            </Drawer>
          </Box>
        )}

        <Box flex={1} />

        {/* Day navigator — pill style */}
        <Box
          display="flex"
          alignItems="center"
          sx={{
            bgcolor: isToday
              ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)')
              : (isDark ? 'rgba(255,184,48,0.15)' : 'rgba(255,184,48,0.12)'),
            borderRadius: '100px',
            border: isToday ? 'none' : '1.5px solid rgba(255,184,48,0.4)',
            px: 0.25,
            transition: 'background 0.2s ease, border 0.2s ease',
          }}
        >
          <IconButton
            onClick={goToPreviousDay}
            size="small"
            aria-label="Previous day"
            sx={{
              color: isToday ? 'text.secondary' : 'warning.main',
              minWidth: 40,
              minHeight: 40,
              borderRadius: '50%',
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Button
            variant="text"
            onClick={!isToday ? goToToday : undefined}
            disableRipple={isToday}
            sx={{
              color: isToday ? 'text.primary' : 'warning.main',
              fontWeight: 700,
              fontSize: '0.8rem',
              minWidth: { xs: 74, sm: 130 },
              textTransform: 'none',
              px: 0.25,
              py: 0,
              cursor: isToday ? 'default' : 'pointer',
              '&:hover': { bgcolor: 'transparent' },
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
            size="small"
            aria-label="Next day"
            sx={{
              color: isToday ? 'text.disabled' : 'text.secondary',
              minWidth: 40,
              minHeight: 40,
              borderRadius: '50%',
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <Box flex={1} />

        {/* Segmented control — Personal / Group */}
        <Box
          role="tablist"
          sx={{
            display: 'flex',
            bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            borderRadius: '100px',
            p: '3px',
            gap: 0,
          }}
        >
          {(['Personal', 'Group'] as const).map((label, idx) => {
            const active = currentTab === idx;
            return (
              <Box
                key={label}
                role="tab"
                tabIndex={0}
                aria-selected={active}
                onClick={() => navigate(idx === 0 ? '/dashboard' : '/group')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(idx === 0 ? '/dashboard' : '/group');
                  }
                }}
                sx={{
                  px: { xs: 1.25, sm: 2 },
                  py: 0.6,
                  borderRadius: '100px',
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
                  color: active ? (isDark ? '#fff' : '#1A1A2E') : 'text.secondary',
                  bgcolor: active
                    ? (isDark ? 'rgba(108,92,231,0.9)' : '#fff')
                    : 'transparent',
                  boxShadow: active
                    ? (isDark ? '0 2px 8px rgba(108,92,231,0.4)' : '0 1px 4px rgba(0,0,0,0.12)')
                    : 'none',
                  '&:active': { transform: 'scale(0.95)' },
                  outline: 'none',
                  '&:focus-visible': {
                    outline: `2px solid ${isDark ? '#A29BFE' : '#6C5CE7'}`,
                    outlineOffset: 1,
                  },
                }}
              >
                {label}
              </Box>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
