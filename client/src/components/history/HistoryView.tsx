import React, { useState } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Card,
  CardActionArea,
  CardContent,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import IconButton from '@mui/material/IconButton';
import { format } from 'date-fns';
import { useUserContext } from '../../context/UserContext';
import { useHistoryPeriods, useHistoryDetail } from '../../hooks/useHistory';
import { periodKeyToLabel } from '../../utils/dates';
import ArchivedMonthDetail from './ArchivedMonthDetail';
import CircularProgressRing from '../shared/CircularProgressRing';
import { staggerDelay } from '../../theme/animations';

function MonthCardSkeleton() {
  return (
    <Card sx={{ borderRadius: '20px' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box flex={1}>
            <Skeleton variant="text" width="55%" height={24} sx={{ mb: 0.5, borderRadius: 2 }} />
            <Skeleton variant="text" width="35%" height={16} sx={{ borderRadius: 2 }} />
          </Box>
          <Skeleton variant="circular" width={52} height={52} />
        </Box>
      </CardContent>
    </Card>
  );
}

function MonthCard({
  periodKey, userId, onClick, index,
}: {
  periodKey: string;
  userId: string;
  onClick: () => void;
  index: number;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data } = useHistoryDetail(userId, periodKey);
  const goals = data?.goals ?? [];
  const avgPct =
    goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.percentage, 0) / goals.length)
      : 0;

  const ringColor = avgPct >= 80 ? '#00C9A7' : avgPct >= 50 ? '#FFB830' : '#EF5350';
  const trackColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  // Parse year/month for display
  const [year, month] = periodKey.split('-');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthName = monthNames[parseInt(month, 10) - 1] ?? month;

  return (
    <Card
      sx={{
        borderRadius: '20px',
        overflow: 'hidden',
        animation: `fadeSlideUp 350ms ease-out ${index * 40}ms both`,
        '@keyframes fadeSlideUp': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        background: goals.length > 0
          ? isDark
            ? `linear-gradient(135deg, ${alpha(ringColor, 0.08)} 0%, transparent 60%), ${theme.palette.background.paper}`
            : `linear-gradient(135deg, ${alpha(ringColor, 0.05)} 0%, transparent 60%), ${theme.palette.background.paper}`
          : undefined,
      }}
    >
      <CardActionArea onClick={onClick} sx={{ borderRadius: '20px' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {monthName}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {year} · {goals.length} goal{goals.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {goals.length > 0 && (
            <CircularProgressRing
              value={Math.min(avgPct, 100)}
              size={52}
              strokeWidth={4}
              color={ringColor}
              trackColor={trackColor}
              animate={false}
            >
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: ringColor, lineHeight: 1 }}>
                {avgPct}%
              </Typography>
            </CircularProgressRing>
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
        <Box display="flex" alignItems="center" gap={0.5} mb={2.5}>
          <IconButton onClick={() => setSelectedPeriod(null)} size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
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
      <Typography
        variant="h5"
        fontWeight={800}
        mb={2.5}
        sx={{ letterSpacing: '-0.02em' }}
      >
        History
      </Typography>

      {isLoading && (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1.75}>
          {[1, 2, 3, 4].map((i) => (
            <MonthCardSkeleton key={i} />
          ))}
        </Box>
      )}

      {!isLoading && pastPeriods.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          py={8}
          gap={2}
          textAlign="center"
        >
          <Box sx={{ fontSize: 48 }}>📅</Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
              Nothing here yet
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={240} mx="auto">
              Your history will appear here at the end of the month.
            </Typography>
          </Box>
        </Box>
      )}

      {!isLoading && pastPeriods.length > 0 && selectedUser && (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1.75}>
          {pastPeriods.map((pk, index) => (
            <MonthCard
              key={pk}
              periodKey={pk}
              userId={selectedUser.id}
              onClick={() => setSelectedPeriod(pk)}
              index={index}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
