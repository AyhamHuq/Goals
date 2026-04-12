import React from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Skeleton, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { SimpleBarChart } from './charts/TrendChart';
import ProgressAreaChart from './charts/ProgressAreaChart';
import { useAdminGoalDetail } from '../../hooks/useAdmin';

export default function AdminGoalDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminGoalDetail(id);

  const likesBarData = (data?.likesTimeline ?? []).map(l => ({
    label: l.date.slice(5),
    value: l.count,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>Goal Detail</Typography>
      </Box>

      {/* Goal header */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        {isLoading ? (
          <Box><Skeleton width="60%" height={28} /><Skeleton width="40%" /></Box>
        ) : data && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Typography variant="h6" fontWeight={700}>{data.goal.title}</Typography>
              {data.goal.category_name && (
                <Chip label={data.goal.category_name} size="small" variant="outlined" />
              )}
              <Chip label={data.goal.period_key} size="small" />
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <InfoRow label="User" value={data.goal.user_display_name} />
              <InfoRow label="Target" value={`${data.goal.target_value} ${data.goal.unit}`} />
              <InfoRow label="Type" value={`${data.goal.goal_type} · ${data.goal.frequency_type}`} />
              <InfoRow label="Created" value={format(new Date(data.goal.created_at), 'MMM d, yyyy')} />
            </Box>
            {/* Progress bar */}
            {data.entries.length > 0 && (() => {
              const current = data.cumulativeProgress[data.cumulativeProgress.length - 1]?.cumulative ?? 0;
              const pct = Math.min(100, Math.round((current / data.goal.target_value) * 100));
              return (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Progress</Typography>
                    <Typography variant="caption" fontWeight={600}>{current} / {data.goal.target_value} {data.goal.unit} ({pct}%)</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': { bgcolor: pct >= 100 ? '#00C9A7' : pct >= 70 ? '#FFB830' : '#6C5CE7', borderRadius: 4 } }}
                  />
                </Box>
              );
            })()}
          </Box>
        )}
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Progress chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Cumulative Progress</Typography>
            {isLoading ? (
              <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
            ) : (
              <ProgressAreaChart
                data={data?.cumulativeProgress ?? []}
                target={data?.goal.target_value ?? 0}
                unit={data?.goal.unit ?? ''}
              />
            )}
          </Paper>
        </Grid>

        {/* Likes */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Likes ({(data?.likesTimeline ?? []).reduce((s, l) => s + l.count, 0)})
            </Typography>
            {isLoading ? (
              <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
            ) : (
              <SimpleBarChart data={likesBarData} color="#FF6B6B" height={240} />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Entries table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Entries ({data?.entries.length ?? '—'})
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'background.default', fontWeight: 600 } }}>
                <TableCell>Date</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Logged At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1,2,3,4].map(j => <TableCell key={j}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
                : (data?.entries ?? []).map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.logged_for}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{e.value} {data?.goal.unit}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{e.note ?? '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(e.created_at), 'MMM d, HH:mm')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Box>
  );
}
