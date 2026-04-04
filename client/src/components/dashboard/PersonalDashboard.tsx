import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Skeleton,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useUserContext } from '../../context/UserContext';
import { usePeriodContext } from '../../context/PeriodContext';
import { usePersonalDashboard } from '../../hooks/useDashboard';
import GoalCard from './GoalCard';
import GoalFormDialog from '../goals/GoalFormDialog';

function GoalCardSkeleton() {
  return (
    <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="40%" height={16} />
      <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4, my: 1 }} />
      <Skeleton variant="text" width="30%" height={16} />
      <Skeleton variant="rectangular" width={120} height={32} sx={{ mt: 1, borderRadius: 1 }} />
    </Box>
  );
}

export default function PersonalDashboard() {
  const { selectedUser } = useUserContext();
  const { periodKey, isCurrentPeriod } = usePeriodContext();
  const [addGoalOpen, setAddGoalOpen] = useState(false);

  const { data, isLoading, isError } = usePersonalDashboard(selectedUser?.id, periodKey);

  const goals = data?.goals ?? [];
  const onTrackCount = goals.filter((g) => g.on_track === true).length;
  const totalCount = goals.length;

  if (isError) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="error">Failed to load dashboard. Please try again.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header row */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          My Goals
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          {!isLoading && totalCount > 0 && (
            <Chip
              label={`${onTrackCount}/${totalCount} on track`}
              color={onTrackCount === totalCount ? 'success' : 'default'}
              size="small"
            />
          )}
          {isCurrentPeriod && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddGoalOpen(true)}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Add Goal
            </Button>
          )}
        </Box>
      </Box>

      {/* Loading */}
      {isLoading && (
        <Stack spacing={2}>
          <GoalCardSkeleton />
          <GoalCardSkeleton />
          <GoalCardSkeleton />
        </Stack>
      )}

      {/* Empty state */}
      {!isLoading && totalCount === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
          gap={2}
        >
          <Typography color="text.secondary" variant="h6">
            No goals yet
          </Typography>
          {isCurrentPeriod && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddGoalOpen(true)}
            >
              Add your first goal
            </Button>
          )}
        </Box>
      )}

      {/* Goal cards */}
      {!isLoading && totalCount > 0 && (
        <Stack spacing={2}>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} readOnly={!isCurrentPeriod} />
          ))}
        </Stack>
      )}

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
