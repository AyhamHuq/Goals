import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Skeleton,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useGroupDashboard } from '../../hooks/useDashboard';
import { usePeriodContext } from '../../context/PeriodContext';
import { useUserContext } from '../../context/UserContext';
import { GoalWithProgress } from '../../types';
import { formatPercentage } from '../../utils/frequency';
import { periodKeyToLabel } from '../../utils/dates';

function avgPercentage(goals: GoalWithProgress[]): number {
  if (!goals.length) return 0;
  return goals.reduce((sum, g) => sum + g.percentage, 0) / goals.length;
}

function UserCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box flex={1}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="60%" height={16} />
          </Box>
          <Skeleton variant="text" width={48} height={20} />
        </Box>
        <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 6 }} />
      </CardContent>
    </Card>
  );
}

export default function GroupDashboard() {
  const { selectedUser } = useUserContext();
  const { periodKey } = usePeriodContext();
  const groupId = selectedUser?.group_id;

  const { data, isLoading, isError } = useGroupDashboard(groupId, periodKey);

  if (isError) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="error">Failed to load group dashboard.</Typography>
      </Box>
    );
  }

  const hasAnyGoals = data?.users.some((u) => u.goals.length > 0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Family Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2.5}>
        {periodKeyToLabel(periodKey)}
      </Typography>

      {isLoading && (
        <Stack spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </Stack>
      )}

      {!isLoading && data && !hasAnyGoals && (
        <Box py={6} textAlign="center">
          <Typography color="text.secondary">
            No one has set goals for this period yet.
          </Typography>
        </Box>
      )}

      {!isLoading && data && hasAnyGoals && (
        <Stack spacing={2}>
          {data.users.map(({ user, goals }) => {
            const avg = avgPercentage(goals);
            const onTrack = goals.filter((g) => g.on_track === true).length;
            const barColor: 'success' | 'warning' | 'error' =
              avg >= 80 ? 'success' : avg >= 50 ? 'warning' : 'error';
            const isChampion = avg >= 80;

            return (
              <Card key={user.id} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1.5} mb={1.25}>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: user.avatar_color,
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                    >
                      {user.display_name[0].toUpperCase()}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <Typography fontWeight={700} noWrap>
                          {user.display_name}
                        </Typography>
                        {isChampion && (
                          <EmojiEventsIcon sx={{ fontSize: 16, color: '#FFA726' }} />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {goals.length === 0
                          ? 'No goals this period'
                          : `${onTrack}/${goals.length} goals on track`}
                      </Typography>
                    </Box>
                    <Chip
                      label={formatPercentage(avg)}
                      size="small"
                      color={barColor}
                      sx={{ fontWeight: 700, minWidth: 52 }}
                    />
                  </Box>

                  {goals.length > 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(avg, 100)}
                      color={barColor}
                      sx={{ height: 8, borderRadius: 6 }}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
