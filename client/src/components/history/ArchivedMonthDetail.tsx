import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Skeleton,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format } from 'date-fns';
import { useHistoryDetail } from '../../hooks/useHistory';
import { useCopyFromPrevious } from '../../hooks/useGoals';
import { usePeriodContext } from '../../context/PeriodContext';
import GoalCard from '../dashboard/GoalCard';
import { periodKeyToLabel } from '../../utils/dates';

interface ArchivedMonthDetailProps {
  periodKey: string;
  userId: string;
  onBack?: () => void;
}

export default function ArchivedMonthDetail({
  periodKey,
  userId,
  onBack,
}: ArchivedMonthDetailProps) {
  const { data, isLoading, isError } = useHistoryDetail(userId, periodKey);
  const copyFromPrevious = useCopyFromPrevious();
  const { periodKey: currentPeriodKey, isCurrentPeriod } = usePeriodContext();

  const currentMonth = format(new Date(), 'yyyy-MM');
  const isPreviousPeriod = periodKey !== currentMonth;

  const handleCopy = async () => {
    await copyFromPrevious.mutateAsync({
      user_id: userId,
      from_period_key: periodKey,
      to_period_key: currentMonth,
    });
  };

  if (isError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load history for {periodKeyToLabel(periodKey)}.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>
          {periodKeyToLabel(periodKey)}
        </Typography>
        <Box display="flex" gap={1}>
          {isPreviousPeriod && isCurrentPeriod && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
              disabled={copyFromPrevious.isPending}
            >
              Copy to {periodKeyToLabel(currentMonth)}
            </Button>
          )}
          {onBack && (
            <Button size="small" onClick={onBack}>
              Back
            </Button>
          )}
        </Box>
      </Box>

      {copyFromPrevious.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Goals copied to current month!
        </Alert>
      )}

      {isLoading && (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      )}

      {!isLoading && data && data.goals.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={4}>
          No goals for this period.
        </Typography>
      )}

      {!isLoading && data && data.goals.length > 0 && (
        <Stack spacing={2}>
          {data.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} readOnly />
          ))}
        </Stack>
      )}
    </Box>
  );
}
