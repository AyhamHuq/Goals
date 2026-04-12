import React from 'react';
import {
  Box, Typography, Paper, Grid, Skeleton, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { NotificationsActive, NotificationsOff, Devices } from '@mui/icons-material';
import { format } from 'date-fns';
import StatCard from './shared/StatCard';
import { useAdminNotifications } from '../../hooks/useAdmin';

export default function AdminNotifications() {
  const { data, isLoading } = useAdminNotifications();

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Push Notifications</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Users w/ Subscriptions"
            value={data?.usersWithSubscriptions}
            icon={Devices}
            color="#6C5CE7"
            subtext={`${data?.totalSubscriptions ?? '—'} total devices`}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Reminders Enabled"
            value={data?.reminderEnabledCount}
            icon={NotificationsActive}
            color="#00C9A7"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Reminders Disabled"
            value={data && data.usersWithSubscriptions - data.reminderEnabledCount}
            icon={NotificationsOff}
            color="#FF6B6B"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600}>Recent Notifications (last 20)</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'background.default', fontWeight: 600 } }}>
                <TableCell>User</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>For Date</TableCell>
                <TableCell>Sent At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1,2,3,4].map(j => <TableCell key={j}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
                : (data?.recentNotifications ?? []).map((n, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{n.display_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={n.notification_type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{n.sent_for}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(n.sent_at), 'MMM d, HH:mm')}
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
