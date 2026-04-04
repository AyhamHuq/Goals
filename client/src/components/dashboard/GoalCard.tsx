import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { GoalWithProgress } from '../../types';
import { formatPercentage, getFrequencyLabel } from '../../utils/frequency';
import QuickLogButton from '../progress/QuickLogButton';
import ProgressHistoryDrawer from '../progress/ProgressHistoryDrawer';

interface GoalCardProps {
  goal: GoalWithProgress & { id: string };
  readOnly?: boolean;
}

type PacingColor = 'success' | 'warning' | 'error' | 'primary';

function getProgressColor(goal: GoalWithProgress): PacingColor {
  if (goal.on_track === null) return 'primary';
  if (goal.on_track) return 'success';
  if (goal.expected_value !== null && goal.expected_value > 0) {
    const ratio = goal.current_value / goal.expected_value;
    if (ratio >= 0.8) return 'warning';
  }
  return 'error';
}

const colorHexMap: Record<PacingColor, string> = {
  success: '#66BB6A',
  warning: '#FFA726',
  error:   '#EF5350',
  primary: '#5C6BC0',
};

export default function GoalCard({ goal, readOnly = false }: GoalCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const color = getProgressColor(goal);
  const hex = colorHexMap[color];
  const barValue = Math.min(goal.percentage, 100);
  const showPacing = goal.frequency_type !== 'total' && goal.on_track !== null;

  return (
    <>
      <Card
        sx={{
          cursor: readOnly ? 'default' : 'pointer',
          opacity: readOnly ? 0.85 : 1,
          borderLeft: `4px solid ${hex}`,
          borderRadius: 2,
          transition: 'box-shadow 0.2s ease, opacity 0.2s',
        }}
        onClick={() => !readOnly && setDrawerOpen(true)}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          {/* Title row */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ flex: 1, mr: 1, lineHeight: 1.3 }}
            >
              {goal.title}
            </Typography>
            {goal.category && (
              <Chip
                label={goal.category.name}
                size="small"
                sx={{
                  flexShrink: 0,
                  bgcolor: alpha(hex, 0.10),
                  color: hex,
                  border: 'none',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>

          {/* Frequency label */}
          <Typography variant="caption" color="text.secondary" display="block" mb={1.25}>
            {getFrequencyLabel(goal.frequency_type, goal.target_value, goal.unit)}
          </Typography>

          {/* Progress bar + percentage pill */}
          <Box display="flex" alignItems="center" gap={1.5} mb={0.75}>
            <LinearProgress
              variant="determinate"
              value={barValue}
              color={color}
              sx={{ flex: 1, height: 10, borderRadius: 6 }}
            />
            <Chip
              label={formatPercentage(goal.percentage)}
              size="small"
              sx={{
                bgcolor: alpha(hex, 0.12),
                color: hex,
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 22,
                borderRadius: '11px',
                minWidth: 44,
              }}
            />
          </Box>

          {/* Bottom row: current/target | on-track indicator */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {goal.current_value} / {goal.target_value} {goal.unit}
              {goal.frequency_type !== 'total' && goal.expected_value !== null
                ? ` · ${goal.expected_value.toFixed(1)} expected`
                : ''}
            </Typography>

            {showPacing && (
              <Box display="flex" alignItems="center" gap={0.5}>
                {goal.on_track ? (
                  <>
                    <CheckCircleOutlineIcon sx={{ fontSize: 14, color: colorHexMap.success }} />
                    <Typography variant="caption" sx={{ color: colorHexMap.success, fontWeight: 600 }}>
                      On track
                    </Typography>
                  </>
                ) : (
                  <>
                    <HighlightOffIcon sx={{ fontSize: 14, color: colorHexMap.error }} />
                    <Typography variant="caption" sx={{ color: colorHexMap.error, fontWeight: 600 }}>
                      Behind
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>

          {!readOnly && (
            <Box onClick={(e) => e.stopPropagation()} mt={0.5}>
              <QuickLogButton goal={goal} />
            </Box>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <ProgressHistoryDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          goal={goal}
        />
      )}
    </>
  );
}
