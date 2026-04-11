import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Avatar, Chip, Skeleton, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Tooltip,
} from '@mui/material';
import {
  ArrowBack, LocalFireDepartment, NotificationsActive,
  NotificationsOff, CheckCircle,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import TimeRangeFilter, { daysAgo, today } from './shared/TimeRangeFilter';
import CalendarHeatmap from './charts/CalendarHeatmap';
import { TrendLineChart } from './charts/TrendChart';
import { useAdminUserDetail, useAdminHeatmap } from '../../hooks/useAdmin';
import type { TimeRange, TrendPoint } from '../../types/admin';

export default function AdminUserDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [range, setRange] = useState<TimeRange>('1y');
  const [from, setFrom] = useState(() => daysAgo(365));
  const [to, setTo] = useState(today);
  const year = new Date().getFullYear();

  const { data, isLoading } = useAdminUserDetail(id, from, to);
  const { data: heatmap } = useAdminHeatmap(year, id);

  const activityAsTrend: TrendPoint[] = (data?.activityByDay ?? []).map(d => ({
    date: d.date,
    entriesLogged: d.count,
    goalsCreated: 0,
    activeUsers: 0,
    likesGiven: 0,
    dailyCompletions: 0,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/users')} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>User Detail</Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TimeRangeFilter from={from} to={to} range={range} onRangeChange={(r, f, t) => { setRange(r); setFrom(f); setTo(t); }} />
      </Box>

      {/* User header */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="circular" width={56} height={56} />
            <Box sx={{ flex: 1 }}><Skeleton width="40%" /><Skeleton width="60%" /></Box>
          </Box>
        ) : data && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: data.user.avatar_color, fontSize: 22 }}>
              {data.user.display_name[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>{data.user.display_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Joined {format(new Date(data.user.created_at), 'MMM d, yyyy')}
                {data.user.last_active_at && ` · Last active ${formatDistanceToNow(new Date(data.user.last_active_at), { addSuffix: true })}`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {data.user.streak > 0 && (
                <Chip
                  icon={<LocalFireDepartment />}
                  label={`${data.user.streak} day streak`}
                  size="small"
                  sx={{ bgcolor: '#FF6B6B22', color: '#FF6B6B' }}
                />
              )}
              <Chip
                icon={data.user.push_reminders_enabled ? <NotificationsActive /> : <NotificationsOff />}
                label={data.user.push_reminders_enabled ? `Reminders at ${data.user.reminder_hour}:00` : 'Reminders off'}
                size="small"
                sx={{
                  bgcolor: data.user.push_reminders_enabled ? '#00C9A722' : 'action.hover',
                  color: data.user.push_reminders_enabled ? '#00C9A7' : 'text.secondary',
                }}
              />
              <Chip
                icon={<CheckCircle />}
                label={`${data.user.push_subscriptions} device${data.user.push_subscriptions !== 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        )}
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Activity heatmap */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Activity — {year}</Typography>
            {heatmap ? (
              <CalendarHeatmap data={heatmap} year={year} />
            ) : (
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            )}
          </Paper>
        </Grid>

        {/* Period summaries */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', overflow: 'auto', maxHeight: 240 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Monthly Summaries</Typography>
            {isLoading ? <Skeleton height={120} /> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Month</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Goals</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Avg %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.periodSummaries ?? []).map(p => (
                    <TableRow key={p.period_key}>
                      <TableCell sx={{ fontSize: 12 }}>{p.period_key}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{p.goals_count}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={p.avg_completion}
                            sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': { bgcolor: p.avg_completion >= 80 ? '#00C9A7' : '#FFB830' } }}
                          />
                          {p.avg_completion}%
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Activity trend */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Daily Entry Activity</Typography>
        <TrendLineChart
          data={activityAsTrend}
          lines={[{ key: 'entriesLogged', label: 'Entries', color: '#6C5CE7' }]}
          height={200}
        />
      </Paper>

      {/* Goals table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600}>Goals</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'background.default', fontWeight: 600 } }}>
                <TableCell>Title</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Entries</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
                : (data?.goals ?? []).map(goal => (
                  <TableRow
                    key={goal.id}
                    hover
                    onClick={() => navigate(`/goals/${goal.id}`)}
                    sx={{ cursor: 'pointer', opacity: goal.is_archived ? 0.5 : 1 }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{goal.title}</Typography>
                    </TableCell>
                    <TableCell>{goal.period_key}</TableCell>
                    <TableCell>
                      {goal.category_name && (
                        <Chip label={goal.category_name} size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="caption">{goal.target_value} {goal.unit}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={goal.percentage}
                          sx={{ width: 60, height: 6, borderRadius: 3, bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': { bgcolor: goal.percentage >= 100 ? '#00C9A7' : goal.percentage >= 70 ? '#FFB830' : '#FF6B6B' } }}
                        />
                        <Typography variant="caption">{goal.percentage}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{goal.entries_count}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
