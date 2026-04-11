import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Avatar, Chip, Skeleton, Tooltip,
  LinearProgress,
} from '@mui/material';
import { NotificationsActive, NotificationsOff, LocalFireDepartment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TimeRangeFilter, { daysAgo, today } from './shared/TimeRangeFilter';
import { useAdminUsers } from '../../hooks/useAdmin';
import type { TimeRange, AdminUser } from '../../types/admin';
import { formatDistanceToNow } from 'date-fns';

type SortKey = keyof AdminUser;
type SortDir = 'asc' | 'desc';

export default function AdminUsers() {
  const [range, setRange] = useState<TimeRange>('30d');
  const [from, setFrom] = useState(() => daysAgo(30));
  const [to, setTo] = useState(today);
  const [sortKey, setSortKey] = useState<SortKey>('entries_count');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const navigate = useNavigate();
  const { data: users, isLoading } = useAdminUsers(from, to);

  const sorted = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'string' && typeof bv === 'string'
        ? av.localeCompare(bv)
        : Number(av ?? 0) - Number(bv ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [users, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortableCell = ({ field, label }: { field: SortKey; label: string }) => (
    <TableCell sortDirection={sortKey === field ? sortDir : false} sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
      <TableSortLabel
        active={sortKey === field}
        direction={sortKey === field ? sortDir : 'asc'}
        onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Users</Typography>

      <Box sx={{ mb: 3 }}>
        <TimeRangeFilter from={from} to={to} range={range} onRangeChange={(r, f, t) => { setRange(r); setFrom(f); setTo(t); }} />
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'background.default' } }}>
              <SortableCell field="display_name" label="User" />
              <SortableCell field="goals_count" label="Goals" />
              <SortableCell field="entries_count" label="Entries" />
              <SortableCell field="avg_completion" label="Avg %" />
              <SortableCell field="streak" label="Streak" />
              <SortableCell field="likes_given" label="Likes Given" />
              <SortableCell field="likes_received" label="Likes Recv" />
              <SortableCell field="period_count" label="Months" />
              <TableCell sx={{ fontWeight: 600 }}>Push</TableCell>
              <SortableCell field="last_active_at" label="Last Active" />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((__, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
              : sorted.map(user => (
                <TableRow
                  key={user.id}
                  hover
                  onClick={() => navigate(`/users/${user.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: user.avatar_color, fontSize: 12 }}>
                        {user.display_name[0]}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>{user.display_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.goals_count}</TableCell>
                  <TableCell>{user.entries_count}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={user.avg_completion}
                        sx={{ width: 50, height: 6, borderRadius: 3, bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': { bgcolor: user.avg_completion >= 80 ? '#00C9A7' : user.avg_completion >= 50 ? '#FFB830' : '#FF6B6B' } }}
                      />
                      <Typography variant="body2">{user.avg_completion}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {user.streak > 0 && (
                      <Chip
                        icon={<LocalFireDepartment sx={{ fontSize: '14px !important' }} />}
                        label={user.streak}
                        size="small"
                        sx={{ bgcolor: '#FF6B6B22', color: '#FF6B6B', fontWeight: 700, height: 22 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{user.likes_given}</TableCell>
                  <TableCell>{user.likes_received}</TableCell>
                  <TableCell>{user.period_count}</TableCell>
                  <TableCell>
                    <Tooltip title={user.push_reminders_enabled ? 'Reminders on' : 'Reminders off'}>
                      {user.push_reminders_enabled
                        ? <NotificationsActive sx={{ fontSize: 18, color: '#00C9A7' }} />
                        : <NotificationsOff sx={{ fontSize: 18, color: 'text.disabled' }} />}
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      {user.last_active_at
                        ? formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })
                        : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
