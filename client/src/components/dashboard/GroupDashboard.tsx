import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  LinearProgress,
  Chip,
  Skeleton,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useGroupDashboard } from '../../hooks/useDashboard';
import { usePeriodContext } from '../../context/PeriodContext';
import { useUserContext } from '../../context/UserContext';
import { GoalWithProgress } from '../../types';
import { formatPercentage } from '../../utils/frequency';

function avgPercentage(goals: GoalWithProgress[]): number {
  if (!goals.length) return 0;
  return goals.reduce((sum, g) => sum + g.percentage, 0) / goals.length;
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

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Group Dashboard
      </Typography>

      {isLoading && (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      )}

      {!isLoading && data && (
        <Stack spacing={1.5}>
          {data.users.map(({ user, goals }) => {
            const avg = avgPercentage(goals);
            const onTrack = goals.filter((g) => g.on_track === true).length;
            return (
              <Accordion key={user.id} disableGutters elevation={0} variant="outlined"
                sx={{ borderRadius: '12px !important', '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1.5} flex={1} mr={1}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: user.avatar_color, fontSize: 15 }}>
                      {user.display_name[0].toUpperCase()}
                    </Avatar>
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={600}>{user.display_name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatPercentage(avg)} avg
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(avg, 100)}
                        sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                        color={avg >= 80 ? 'success' : avg >= 50 ? 'warning' : 'error'}
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  {goals.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No goals this period.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      <Box display="flex" gap={1} flexWrap="wrap" mb={0.5}>
                        <Chip
                          label={`${goals.length} goal${goals.length !== 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${onTrack} on track`}
                          size="small"
                          color={onTrack === goals.length ? 'success' : 'default'}
                        />
                      </Box>
                      {goals.map((goal) => (
                        <Box key={goal.id}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" noWrap sx={{ flex: 1, mr: 1 }}>
                              {goal.title}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {formatPercentage(goal.percentage)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(goal.percentage, 100)}
                            sx={{ height: 4, borderRadius: 2 }}
                            color={
                              goal.on_track === null
                                ? 'primary'
                                : goal.on_track
                                ? 'success'
                                : 'error'
                            }
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
