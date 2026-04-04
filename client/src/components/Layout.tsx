import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import TopAppBar from './TopAppBar';
import BottomNav from './BottomNav';
import GoalFormDialog from './goals/GoalFormDialog';
import { useUserContext } from '../context/UserContext';
import { usePeriodContext } from '../context/PeriodContext';

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { selectedUser } = useUserContext();
  const { periodKey } = usePeriodContext();
  const [addGoalOpen, setAddGoalOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopAppBar />
      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 1.5, sm: 3 },
          pb: isMobile ? '72px' : undefined,
        }}
      >
        <Outlet />
      </Box>
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
