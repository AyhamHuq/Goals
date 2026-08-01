import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Skeleton, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  People, TrackChanges, TrendingUp, Favorite, CheckCircle, Timeline,
} from '@mui/icons-material';
import StatCard from './shared/StatCard';
import TimeRangeFilter, { daysAgo, today } from './shared/TimeRangeFilter';
import { TrendLineChart } from './charts/TrendChart';
import CalendarHeatmap from './charts/CalendarHeatmap';
import { useAdminOverview, useAdminTrends, useAdminHeatmap } from '../../hooks/useAdmin';
import type { TimeRange } from '../../types/admin';

export default function AdminOverview() {
  const [range, setRange] = useState<TimeRange>('30d');
  const [from, setFrom] = useState(() => daysAgo(30));
  const [to, setTo] = useState(today);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const year = new Date().getFullYear();

  const { data: overview, isLoading: overviewLoading } = useAdminOverview(from, to);
  const { data: trends, isLoading: trendsLoading } = useAdminTrends(from, to, granularity);
  const { data: heatmap } = useAdminHeatmap(year);

  const handleRangeChange = (r: TimeRange, f: string, t: string) => {
    setRange(r);
    setFrom(f);
    setTo(t);
    if (r !== 'custom') {
      const days = f ? Math.ceil((new Date(t).getTime() - new Date(f).getTime()) / 86400000) : 365;
      setGranularity(days <= 30 ? 'day' : days <= 180 ? 'week' : 'month');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Overview</Typography>

      <Box sx={{ mb: 3 }}>
        <TimeRangeFilter from={from} to={to} range={range} onRangeChange={handleRangeChange} />
      </Box>

      {/* Stat cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {[
          { label: 'Users', value: overview?.totalUsers, icon: People, color: '#6C5CE7', subtext: `${overview?.activeUsers ?? '—'} active` },
          { label: 'Goals', value: overview?.goalsCreated, icon: TrackChanges, color: '#00C9A7', subtext: `${overview?.totalGoals ?? '—'} total` },
          { label: 'Entries', value: overview?.entriesLogged, icon: TrendingUp, color: '#FFB830', subtext: `${overview?.avgEntriesPerUser ?? '—'} avg/user` },
          { label: 'Completion', value: overview ? `${overview.completionRate}%` : undefined, icon: CheckCircle, color: '#00C9A7', subtext: 'at target' },
          { label: 'Likes', value: overview?.totalLikes, icon: Favorite, color: '#FF6B6B' },
          { label: 'Days Done', value: overview?.totalDailyCompletions, icon: Timeline, color: '#a29bfe', subtext: 'in range' },
        ].map((card, i) => (
          <Grid item xs={4} sm={4} md={2} key={i}>
            <StatCard {...card} loading={overviewLoading} />
          </Grid>
        ))}
      </Grid>

      {/* Trend chart */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>Activity Trends</Typography>
          <ToggleButtonGroup
            value={granularity}
            exclusive
            onChange={(_e, v) => { if (v) setGranularity(v); }}
            size="small"
          >
            {(['day', 'week', 'month'] as const).map(g => (
              <ToggleButton key={g} value={g} sx={{ px: 1.5, py: 0.5, fontSize: 12 }}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        {trendsLoading ? (
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
        ) : (
          <TrendLineChart
            data={trends ?? []}
            lines={[
              { key: 'entriesLogged', label: 'Entries', color: '#6C5CE7' },
              { key: 'activeUsers', label: 'Active Users', color: '#00C9A7' },
              { key: 'dailyCompletions', label: 'Days Completed', color: '#FFB830' },
              { key: 'likesGiven', label: 'Likes', color: '#FF6B6B' },
            ]}
          />
        )}
      </Paper>

      {/* Heatmap */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Activity Heatmap — {year}</Typography>
        {heatmap ? (
          <CalendarHeatmap data={heatmap} year={year} />
        ) : (
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        )}
      </Paper>
    </Box>
  );
}
