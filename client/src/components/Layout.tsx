import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Fade, useMediaQuery, useTheme } from '@mui/material';
import TopAppBar from './TopAppBar';
import BottomNav from './BottomNav';
import GoalFormDialog from './goals/GoalFormDialog';
import { useUserContext } from '../context/UserContext';
import { usePeriodContext } from '../context/PeriodContext';

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  const { selectedUser } = useUserContext();
  const { periodKey } = usePeriodContext();
  const location = useLocation();
  const [addGoalOpen, setAddGoalOpen] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        // Subtle gradient overlay on the background
        background: isDark
          ? 'radial-gradient(ellipse at 10% 0%, rgba(108,92,231,0.08) 0%, transparent 50%), radial-gradient(ellipse at 90% 100%, rgba(255,107,107,0.05) 0%, transparent 50%)'
          : 'radial-gradient(ellipse at 10% 0%, rgba(108,92,231,0.05) 0%, transparent 50%), radial-gradient(ellipse at 90% 100%, rgba(255,107,107,0.03) 0%, transparent 50%)',
      }}
    >
      <TopAppBar />
      <Fade key={location.pathname} in timeout={160}>
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 3 },
            pb: isMobile
              ? 'calc(100px + env(safe-area-inset-bottom, 0px))'
              : { xs: 1.5, sm: 3 },
            pl: { xs: 'max(12px, calc(12px + env(safe-area-inset-left, 0px)))', sm: 3 },
            pr: { xs: 'max(12px, calc(12px + env(safe-area-inset-right, 0px)))', sm: 3 },
          }}
        >
          <Outlet />
        </Box>
      </Fade>
      <BottomNav onAddGoal={() => setAddGoalOpen(true)} />
      {selectedUser && (
        <GoalFormDialog
          open={addGoalOpen}
          onClose={() => setAddGoalOpen(false)}
          userId={selectedUser.id}
          periodKey={periodKey}
        />
      )}
    </Box>
  );
}
