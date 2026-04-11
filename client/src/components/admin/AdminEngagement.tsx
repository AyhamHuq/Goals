import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Skeleton, Avatar } from '@mui/material';
import TimeRangeFilter, { daysAgo, today } from './shared/TimeRangeFilter';
import CalendarHeatmap from './charts/CalendarHeatmap';
import { SimpleBarChart } from './charts/TrendChart';
import CategoryPieChart from './charts/PieChart';
import { useAdminEngagement, useAdminHeatmap } from '../../hooks/useAdmin';
import type { TimeRange } from '../../types/admin';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hourLabel(h: number): string {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

export default function AdminEngagement() {
  const [range, setRange] = useState<TimeRange>('90d');
  const [from, setFrom] = useState(() => daysAgo(90));
  const [to, setTo] = useState(today);
  const year = new Date().getFullYear();

  const { data, isLoading } = useAdminEngagement(from, to);
  const { data: heatmap } = useAdminHeatmap(year);

  const hourData = Array.from({ length: 24 }, (_, h) => ({
    label: hourLabel(h),
    value: data?.hourDistribution.find(d => d.hour === h)?.count ?? 0,
  }));

  const dowData = Array.from({ length: 7 }, (_, i) => ({
    label: DOW_LABELS[i],
    value: data?.dowDistribution.find(d => d.dow === i)?.count ?? 0,
  }));

  const categoryPieData = (data?.categoryBreakdown ?? []).map(c => ({
    name: c.category,
    value: c.goals_count,
  }));

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Engagement</Typography>

      <Box sx={{ mb: 3 }}>
        <TimeRangeFilter from={from} to={to} range={range} onRangeChange={(r, f, t) => { setRange(r); setFrom(f); setTo(t); }} />
      </Box>

      {/* Heatmap */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Activity Heatmap — {year}</Typography>
        {heatmap ? (
          <CalendarHeatmap data={heatmap} year={year} />
        ) : (
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        )}
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Hour of day */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>When do users log entries?</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Entries by hour of day</Typography>
            {isLoading ? (
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            ) : (
              <SimpleBarChart data={hourData} color="#6C5CE7" height={220} />
            )}
          </Paper>
        </Grid>

        {/* Day of week */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Day of week distribution</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Entries per day of week</Typography>
            {isLoading ? (
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            ) : (
              <SimpleBarChart data={dowData} color="#FFB830" height={220} />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Category breakdown */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Goals by Category</Typography>
            {isLoading ? (
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
            ) : (
              <CategoryPieChart data={categoryPieData} />
            )}
          </Paper>
        </Grid>

        {/* Top users */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Most Active Users</Typography>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1, borderRadius: 2 }} />)
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {(data?.topUsers ?? []).map((u, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 18, textAlign: 'right' }}>
                      {i + 1}
                    </Typography>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: u.avatar_color, fontSize: 14 }}>
                      {u.display_name[0]}
                    </Avatar>
                    <Typography variant="body2" sx={{ flex: 1 }}>{u.display_name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 80 }}>
                        <Box
                          sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: '#6C5CE7',
                            width: `${Math.round((u.entries_count / (data?.topUsers[0].entries_count ?? 1)) * 100)}%`,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{u.entries_count}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
