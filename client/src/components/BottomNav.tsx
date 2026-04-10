import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

interface BottomNavProps {
  onAddGoal: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  isCenter?: boolean;
}

export default function BottomNav({ onAddGoal }: BottomNavProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme.palette.mode === 'dark';

  if (!isMobile) return null;

  const items: NavItem[] = [
    { label: 'Dashboard', icon: <HomeRoundedIcon />, path: '/dashboard' },
    { label: 'Add Goal', icon: <AddRoundedIcon sx={{ fontSize: 28, color: '#fff' }} />, action: onAddGoal, isCenter: true },
    { label: 'History', icon: <HistoryRoundedIcon />, path: '/history' },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        pb: 'env(safe-area-inset-bottom, 0px)',
        background: isDark ? 'rgba(15,15,20,0.9)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: isDark
          ? '0 -4px 24px rgba(0,0,0,0.4)'
          : '0 -4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-around"
        sx={{ height: 60, px: 2 }}
      >
        {items.map((item) => {
          const isActive = item.path ? location.pathname === item.path : false;

          if (item.isCenter) {
            return (
              <Box
                key={item.label}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  item.action?.();
                }}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(108,92,231,0.5)',
                  marginTop: '-20px',
                  flexShrink: 0,
                  transition: 'transform 0.15s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.15s ease',
                  '&:active': {
                    transform: 'scale(0.88)',
                    boxShadow: '0 3px 10px rgba(108,92,231,0.4)',
                  },
                }}
              >
                {item.icon}
              </Box>
            );
          }

          return (
            <Box
              key={item.label}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                if (item.path) navigate(item.path);
                item.action?.();
              }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.3,
                cursor: 'pointer',
                flex: 1,
                py: 0.5,
                position: 'relative',
                transition: 'opacity 0.15s ease',
                '&:active': { opacity: 0.7 },
                color: isActive ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'),
              }}
            >
              {/* Active pill indicator */}
              {isActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: isDark ? 'rgba(108,92,231,0.15)' : 'rgba(108,92,231,0.1)',
                    zIndex: 0,
                  }}
                />
              )}
              <Box sx={{ position: 'relative', zIndex: 1, '& svg': { fontSize: 22 } }}>
                {React.cloneElement(item.icon as React.ReactElement, {
                  sx: { fontSize: 22, color: isActive ? '#6C5CE7' : 'inherit' },
                })}
              </Box>
              <Box
                component="span"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1,
                  color: isActive ? 'primary.main' : 'inherit',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {item.label}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
