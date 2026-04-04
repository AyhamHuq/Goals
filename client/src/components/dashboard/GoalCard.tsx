import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Chip,
} from '@mui/material';
import { GoalWithProgress } from '../../types';
import { formatPercentage, getFrequencyLabel } from '../../utils/frequency';
import QuickLogButton from '../progress/QuickLogButton';
import ProgressHistoryDrawer from '../progress/ProgressHistoryDrawer';

interface GoalCardProps {
  goal: GoalWithProgress & { id: string };
  readOnly?: boolean;
}

function getProgressColor(goal: GoalWithProgress): 'success' | 'warning' | 'error' | 'primary' {
  if (goal.on_track === null) return 'primary';
  if (goal.on_track) return 'success';
  // behind — check if >= 80% of expected
  if (goal.expected_value !== null && goal.expected_value > 0) {
    const ratio = goal.current_value / goal.expected_value;
    if (ratio >= 0.8) return 'warning';
  }
  return 'error';
}

const colorMap = {
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  primary: '#1976d2',
};

export default function GoalCard({ goal, readOnly = false }: GoalCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const color = getProgressColor(goal);
  const barValue = Math.min(goal.percentage, 100);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          cursor: 'pointer',
          '&:hover': { boxShadow: 3 },
          transition: 'box-shadow 0.2s',
        }}
        onClick={() => setDrawerOpen(true)}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
              {goal.title}
            </Typography>
            {goal.category && (
              <Chip label={goal.category.name} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
            )}
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            {getFrequencyLabel(goal.frequency_type, goal.target_value, goal.unit)}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <LinearProgress
              variant="determinate"
              value={barValue}
              color={color}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ color: colorMap[color], minWidth: 40, textAlign: 'right' }}
            >
              {formatPercentage(goal.percentage)}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary">
            {goal.current_value} {goal.unit}
            {goal.frequency_type !== 'total' && goal.expected_value !== null
              ? ` · ${goal.expected_value.toFixed(1)} expected`
              : ` / ${goal.target_value} ${goal.unit} total`}
          </Typography>

          {!readOnly && (
            <Box onClick={(e) => e.stopPropagation()}>
              <QuickLogButton goal={goal} />
            </Box>
          )}
        </CardContent>
      </Card>

      <ProgressHistoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        goal={goal}
      />
    </>
  );
}
