import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import HomeIcon from '@mui/icons-material/Home';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HistoryIcon from '@mui/icons-material/History';
import { useMediaQuery, useTheme } from '@mui/material';

interface BottomNavProps {
  onAddGoal: () => void;
}

export default function BottomNav({ onAddGoal }: BottomNavProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  if (!isMobile) return null;

  const pathToValue: Record<string, number> = {
    '/dashboard': 0,
    '/group': 0,
    '/history': 2,
  };
  const value = pathToValue[location.pathname] ?? 0;

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) navigate('/dashboard');
    else if (newValue === 1) onAddGoal();
    else if (newValue === 2) navigate('/history');
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        pb: 'env(safe-area-inset-bottom, 0px)',
        borderTop: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
      }}
      elevation={0}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          height: 56,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 60,
            py: 1,
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: 'primary.main',
          },
        }}
      >
        <BottomNavigationAction label="Dashboard" icon={<HomeIcon />} />
        <BottomNavigationAction
          label="Add Goal"
          icon={<AddCircleIcon sx={{ fontSize: 30, color: 'primary.main' }} />}
          sx={{ '& .MuiBottomNavigationAction-label': { color: 'primary.main', fontWeight: 600 } }}
        />
        <BottomNavigationAction label="History" icon={<HistoryIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
