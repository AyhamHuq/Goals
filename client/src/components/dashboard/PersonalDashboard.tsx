import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Skeleton,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { getHours } from 'date-fns';
import { useUserContext } from '../../context/UserContext';
import { usePeriodContext } from '../../context/PeriodContext';
import { usePersonalDashboard } from '../../hooks/useDashboard';
import { formatDayLabel, periodKeyToLabel } from '../../utils/dates';
import GoalCard from './GoalCard';
import GoalFormDialog from '../goals/GoalFormDialog';
import NotificationSettings from '../NotificationSettings';
import { useMarkDayComplete, useUnmarkDayComplete } from '../../hooks/useDailyCompletions';

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
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderTop: '4px solid',
        borderTopColor: 'divider',
        p: 2,
        minHeight: 160,
      }}
    >
      <Skeleton variant="text" width="60%" height={22} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="35%" height={16} sx={{ mb: 1.5 }} />
      <Box display="flex" alignItems="center" gap={2}>
        <Skeleton variant="rectangular" sx={{ flex: 1, height: 10, borderRadius: 6 }} />
        <Skeleton variant="rectangular" width={46} height={20} sx={{ borderRadius: 1 }} />
      </Box>
      <Skeleton variant="text" width="45%" height={16} sx={{ mt: 1 }} />
      <Skeleton variant="rectangular" width={120} height={44} sx={{ mt: 2, borderRadius: 2 }} />
    </Box>
  );
}

export default function PersonalDashboard() {
  const { selectedUser } = useUserContext();
  const { selectedDay, periodKey, isCurrentPeriod, isToday } = usePeriodContext();
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const markComplete = useMarkDayComplete();
  const unmarkComplete = useUnmarkDayComplete();

  const { data, isLoading, isError } = usePersonalDashboard(selectedUser?.id, periodKey, selectedDay);

  const goals = data?.goals ?? [];
  const streak = data?.streak ?? 0;
  const dayCompleted = data?.day_completed ?? false;
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

  const showDoneBar = !isLoading && totalCount > 0 && !!selectedUser;

  if (isError) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="error">Failed to load dashboard. Please try again.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: showDoneBar ? '80px' : 0 }}>
      {/* Greeting header */}
      <Box mb={2.5}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.35rem', sm: '1.5rem' } }}>
              {greeting()}, {selectedUser?.display_name ?? ''}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {isToday ? "Let's make progress today." : `Viewing ${formatDayLabel(selectedDay)}`}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} flexShrink={0} mt={0.5}>
            {selectedUser && (
              <Tooltip title="Notification settings">
                <IconButton size="small" onClick={() => setNotifOpen(true)}>
                  <NotificationsNoneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isCurrentPeriod && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAddGoalOpen(true)}
                sx={{ display: { xs: 'none', sm: 'flex' }, borderRadius: 2 }}
              >
                Add Goal
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Stats bar */}
      {!isLoading && totalCount > 0 && (
        <Box
          display="flex"
          gap={1.5}
          mb={2.5}
          sx={{
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            mx: { xs: -1.5, sm: 0 },
            px: { xs: 1.5, sm: 0 },
          }}
        >
          <Box sx={{ minWidth: 90, bgcolor: alpha('#5C6BC0', 0.08), borderRadius: 2.5, px: 2, py: 1.5, textAlign: 'center', flexShrink: 0 }}>
            <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.2 }}>
              {totalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Goals
            </Typography>
          </Box>

          <Box sx={{ minWidth: 90, bgcolor: alpha('#66BB6A', 0.08), borderRadius: 2.5, px: 2, py: 1.5, textAlign: 'center', flexShrink: 0 }}>
            <Typography variant="h5" fontWeight={800} color="success.main" sx={{ lineHeight: 1.2 }}>
              {onTrackCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              On track
            </Typography>
          </Box>

          <Box sx={{
            minWidth: 90,
            bgcolor: alpha(avgPct >= 80 ? '#66BB6A' : avgPct >= 50 ? '#FFA726' : '#EF5350', 0.08),
            borderRadius: 2.5,
            px: 2,
            py: 1.5,
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: avgPct >= 80 ? '#66BB6A' : avgPct >= 50 ? '#FFA726' : '#EF5350', lineHeight: 1.2 }}>
              {avgPct}%
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Average
            </Typography>
          </Box>

          {streak > 0 && (
            <Box sx={{ minWidth: 90, bgcolor: alpha('#FFA726', 0.08), borderRadius: 2.5, px: 2, py: 1.5, textAlign: 'center', flexShrink: 0 }}>
              <Typography variant="h5" fontWeight={800} color="warning.main" sx={{ lineHeight: 1.2 }}>
                {streak}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Day streak
              </Typography>
            </Box>
          )}
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
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: alpha('#5C6BC0', 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}>
            <TrackChangesIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" fontWeight={600} textAlign="center">
            No goals for {periodKeyToLabel(periodKey)}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={280}>
            Set your first goal to start tracking progress this month.
          </Typography>
          {isCurrentPeriod && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddGoalOpen(true)}
              sx={{ mt: 1, py: 1.25, px: 3, borderRadius: 2.5 }}
            >
              Create your first goal
            </Button>
          )}
        </Box>
      )}

      {/* Goal cards */}
      {!isLoading && totalCount > 0 && (
        <Stack
          spacing={2}
          sx={{
            scrollSnapType: { xs: 'y proximity', sm: 'none' },
            '& > *': {
              scrollSnapAlign: { xs: 'start', sm: 'unset' },
            },
          }}
        >
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} readOnly={false} selectedDay={selectedDay} />
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

      {selectedUser && (
        <NotificationSettings
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          user={selectedUser}
        />
      )}

      {/* Fixed "Done for today" bar — sits above BottomNav */}
      {showDoneBar && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
            left: 0,
            right: 0,
            zIndex: 1099,
            px: 2,
            py: 1.25,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {dayCompleted ? (
            <Box display="flex" alignItems="center" gap={2} width="100%" maxWidth={400} justifyContent="center">
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                label="Day completed!"
                color="success"
                sx={{ fontWeight: 700, fontSize: '0.9rem', px: 1 }}
              />
              <Button
                size="small"
                variant="text"
                color="inherit"
                sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                disabled={unmarkComplete.isPending}
                onClick={() =>
                  unmarkComplete.mutate({ userId: selectedUser!.id, completedDate: selectedDay })
                }
              >
                Undo
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={
                markComplete.isPending
                  ? <CircularProgress size={18} color="inherit" />
                  : <CheckCircleOutlineIcon />
              }
              disabled={markComplete.isPending}
              onClick={() =>
                markComplete.mutate({ userId: selectedUser!.id, completedDate: selectedDay })
              }
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontWeight: 700,
                maxWidth: 400,
              }}
            >
              {isToday ? 'Done for today' : 'Mark day as done'}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
