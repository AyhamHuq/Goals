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
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PercentIcon from '@mui/icons-material/Percent';
import { getHours } from 'date-fns';
import { useUserContext } from '../../context/UserContext';
import { usePeriodContext } from '../../context/PeriodContext';
import { usePersonalDashboard } from '../../hooks/useDashboard';
import { periodKeyToLabel } from '../../utils/dates';
import GoalCard from './GoalCard';
import GoalFormDialog from '../goals/GoalFormDialog';

function greeting(): string {
  const h = getHours(new Date());
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function GoalCardSkeleton() {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: 'divider',
        p: 2,
      }}
    >
      <Skeleton variant="text" width="60%" height={22} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="35%" height={16} sx={{ mb: 1.5 }} />
      <Box display="flex" alignItems="center" gap={1.5}>
        <Skeleton variant="rectangular" sx={{ flex: 1, height: 10, borderRadius: 6 }} />
        <Skeleton variant="rectangular" width={44} height={22} sx={{ borderRadius: '11px' }} />
      </Box>
      <Skeleton variant="text" width="45%" height={16} sx={{ mt: 1 }} />
      <Skeleton variant="rectangular" width={110} height={32} sx={{ mt: 1.5, borderRadius: 1.5 }} />
    </Box>
  );
}

export default function PersonalDashboard() {
  const { selectedUser } = useUserContext();
  const { periodKey, isCurrentPeriod } = usePeriodContext();
  const [addGoalOpen, setAddGoalOpen] = useState(false);

  const { data, isLoading, isError } = usePersonalDashboard(selectedUser?.id, periodKey);

  const goals = data?.goals ?? [];
  // For paced goals use on_track; for non-paced (total/measurement) use proportional time elapsed
  const proportionalThreshold = data
    ? (data.days_elapsed / data.days_in_month) * 100
    : 50;
  const onTrackCount = goals.filter(
    (g) => g.on_track === true || (g.on_track === null && g.percentage >= proportionalThreshold),
  ).length;
  const totalCount = goals.length;
  const avgPct =
    totalCount > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.percentage, 0) / totalCount)
      : 0;

  if (isError) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="error">Failed to load dashboard. Please try again.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Greeting header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {greeting()}, {selectedUser?.display_name ?? ''} 👋
          </Typography>
          {!isCurrentPeriod && (
            <Chip
              label="Past period — read only"
              size="small"
              variant="outlined"
              color="warning"
              sx={{ mt: 0.75 }}
            />
          )}
        </Box>
        {isCurrentPeriod && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddGoalOpen(true)}
            sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}
          >
            Add Goal
          </Button>
        )}
      </Box>

      {/* Stats bar */}
      {!isLoading && totalCount > 0 && (
        <Box display="flex" gap={1} flexWrap="wrap" mb={2.5}>
          <Chip
            icon={<FlagIcon sx={{ fontSize: 15 }} />}
            label={`${totalCount} goal${totalCount !== 1 ? 's' : ''}`}
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
            label={`${onTrackCount} on track`}
            variant="outlined"
            size="small"
            color={onTrackCount === totalCount && totalCount > 0 ? 'success' : 'default'}
          />
          <Chip
            icon={<PercentIcon sx={{ fontSize: 15 }} />}
            label={`${avgPct}% avg`}
            variant="outlined"
            size="small"
            color={avgPct >= 80 ? 'success' : avgPct >= 50 ? 'warning' : 'default'}
          />
        </Box>
      )}

      {/* Loading skeletons */}
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
          <TrackChangesIcon sx={{ fontSize: 56, color: 'primary.light' }} />
          <Typography color="text.secondary" variant="h6" fontWeight={600}>
            No goals for {periodKeyToLabel(periodKey)}
          </Typography>
          {isCurrentPeriod && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddGoalOpen(true)}
            >
              Create your first goal this month
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
