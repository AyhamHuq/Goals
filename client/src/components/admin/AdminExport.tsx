import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Select, MenuItem,
  FormControl, InputLabel, Alert, CircularProgress,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import TimeRangeFilter, { today } from './shared/TimeRangeFilter';
import { getAdminUsers, getAdminUserDetail, getAdminOverview } from '../../api/admin';
import type { TimeRange } from '../../types/admin';

type ExportType = 'users' | 'goals' | 'entries' | 'summary';

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const v = r[h];
        if (v === null || v === undefined) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    ),
  ];
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminExport() {
  const [range, setRange] = useState<TimeRange>('all');
  const [from, setFrom] = useState('2024-01-01');
  const [to, setTo] = useState(today);
  const [exportType, setExportType] = useState<ExportType>('users');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setDone(false);
    try {
      if (exportType === 'users') {
        const users = await getAdminUsers(from, to);
        downloadCSV(users.map(u => ({
          id: u.id,
          name: u.display_name,
          created_at: u.created_at,
          last_active_at: u.last_active_at ?? '',
          push_enabled: u.push_reminders_enabled,
          streak: u.streak,
          goals: u.goals_count,
          entries: u.entries_count,
          avg_completion_pct: u.avg_completion,
          likes_given: u.likes_given,
          likes_received: u.likes_received,
          months_active: u.period_count,
        })), `users_${from}_${to}.csv`);

      } else if (exportType === 'goals' || exportType === 'entries') {
        const users = await getAdminUsers(from, to);
        const allGoals: Record<string, unknown>[] = [];
        const allEntries: Record<string, unknown>[] = [];
        for (const user of users) {
          const detail = await getAdminUserDetail(user.id, from, to);
          for (const g of detail.goals) {
            allGoals.push({
              goal_id: g.id, user: user.display_name, title: g.title,
              period_key: g.period_key, category: g.category_name ?? '',
              target_value: g.target_value, unit: g.unit,
              frequency_type: g.frequency_type, goal_type: g.goal_type,
              current_value: g.current_value, percentage: g.percentage,
              entries_count: g.entries_count, is_archived: g.is_archived,
            });
          }
          if (exportType === 'entries') {
            for (const d of detail.activityByDay) {
              allEntries.push({ user: user.display_name, date: d.date, entries_count: d.count });
            }
          }
        }
        if (exportType === 'goals') {
          downloadCSV(allGoals, `goals_${from}_${to}.csv`);
        } else {
          downloadCSV(allEntries, `activity_${from}_${to}.csv`);
        }

      } else if (exportType === 'summary') {
        const overview = await getAdminOverview(from, to);
        downloadCSV([{
          from, to,
          total_users: overview.totalUsers,
          active_users_in_range: overview.activeUsers,
          total_goals: overview.totalGoals,
          goals_created_in_range: overview.goalsCreated,
          total_entries: overview.totalEntries,
          entries_logged_in_range: overview.entriesLogged,
          avg_entries_per_user: overview.avgEntriesPerUser,
          completion_rate_pct: overview.completionRate,
          total_likes: overview.totalLikes,
          daily_completions_in_range: overview.totalDailyCompletions,
        }], `summary_${from}_${to}.csv`);
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Export Data</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Download data as CSV for further analysis.
      </Typography>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TimeRangeFilter from={from} to={to} range={range} onRangeChange={(r, f, t) => { setRange(r); setFrom(f); setTo(t); }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Export Type</InputLabel>
              <Select
                value={exportType}
                label="Export Type"
                onChange={e => setExportType(e.target.value as ExportType)}
              >
                <MenuItem value="users">Users Summary (1 row per user)</MenuItem>
                <MenuItem value="goals">All Goals (1 row per goal)</MenuItem>
                <MenuItem value="entries">Activity by Day (1 row per user/day)</MenuItem>
                <MenuItem value="summary">Overview Summary</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Download />}
              onClick={handleExport}
              disabled={loading}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)',
                fontWeight: 700,
              }}
            >
              {loading ? 'Preparing...' : 'Download CSV'}
            </Button>
          </Grid>

          {done && (
            <Grid item xs={12}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                Download started successfully.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}
