import React, { useState } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  LinearProgress,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import { format } from 'date-fns';
import { useUserContext } from '../../context/UserContext';
import { useHistoryPeriods, useHistoryDetail } from '../../hooks/useHistory';
import { periodKeyToLabel } from '../../utils/dates';
import ArchivedMonthDetail from './ArchivedMonthDetail';

function MonthCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Skeleton variant="text" width="55%" height={24} sx={{ mb: 0.75 }} />
        <Skeleton variant="text" width="35%" height={18} sx={{ mb: 1.5 }} />
        <Skeleton variant="rectangular" height={6} sx={{ borderRadius: 4 }} />
      </CardContent>
    </Card>
  );
}

function MonthCard({
  periodKey,
  userId,
  onClick,
}: {
  periodKey: string;
  userId: string;
  onClick: () => void;
}) {
  const { data } = useHistoryDetail(userId, periodKey);
  const goals = data?.goals ?? [];
  const avgPct =
    goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.percentage, 0) / goals.length)
      : 0;
  const barColor: 'success' | 'warning' | 'error' =
    avgPct >= 80 ? 'success' : avgPct >= 50 ? 'warning' : 'error';

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardActionArea onClick={onClick} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {periodKeyToLabel(periodKey)}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mb={1.25}>
            <Chip
              label={`${goals.length} goal${goals.length !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
            {goals.length > 0 && (
              <Chip
                label={`${avgPct}% avg`}
                size="small"
                color={barColor}
              />
            )}
          </Box>
          {goals.length > 0 && (
            <LinearProgress
              variant="determinate"
              value={Math.min(avgPct, 100)}
              color={barColor}
              sx={{ height: 6, borderRadius: 4 }}
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function HistoryView() {
  const { selectedUser } = useUserContext();
  const currentMonth = format(new Date(), 'yyyy-MM');

  const { data: periods = [], isLoading } = useHistoryPeriods(selectedUser?.id);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const pastPeriods = periods.filter((p) => p !== currentMonth);

  if (selectedPeriod && selectedUser) {
    return (
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <IconButton onClick={() => setSelectedPeriod(null)} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            History
          </Typography>
        </Box>
        <ArchivedMonthDetail
          periodKey={selectedPeriod}
          userId={selectedUser.id}
          onBack={() => setSelectedPeriod(null)}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2.5}>
        History
      </Typography>

      {isLoading && (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} key={i}>
              <MonthCardSkeleton />
            </Grid>
          ))}
        </Grid>
      )}

      {!isLoading && pastPeriods.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={6}>
          No past months yet. Check back next month!
        </Typography>
      )}

      {!isLoading && pastPeriods.length > 0 && selectedUser && (
        <Grid container spacing={2}>
          {pastPeriods.map((pk) => (
            <Grid item xs={12} sm={6} key={pk}>
              <MonthCard
                periodKey={pk}
                userId={selectedUser.id}
                onClick={() => setSelectedPeriod(pk)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
