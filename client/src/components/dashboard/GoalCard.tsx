import React, { useState, useEffect } from 'react';
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
import { formatPercentage, getMonthlyDisplay, getMonthlyLabel, fmtValue } from '../../utils/frequency';
import { getUnitsForCategory, convertUnit } from '../../constants/unitConversions';
import { fmtValue as fmtV } from '../../utils/frequency';
import QuickLogButton from '../progress/QuickLogButton';
import ProgressHistoryDrawer from '../progress/ProgressHistoryDrawer';

interface GoalCardProps {
  goal: GoalWithProgress & { id: string };
  readOnly?: boolean;
  selectedDay?: string;
}

type PacingColor = 'success' | 'warning' | 'error' | 'primary';

function getProgressColor(goal: GoalWithProgress): PacingColor {
  if (goal.on_track === null) return 'primary';
  if (goal.on_track) return 'success';
  // Ratio-based warning only applies to accumulation goals (higher = better)
  if (goal.goal_type !== 'measurement' && goal.expected_value !== null && goal.expected_value > 0) {
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

export default function GoalCard({ goal, readOnly = false, selectedDay }: GoalCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [displayUnit, setDisplayUnit] = useState(goal.unit);
  const unitOptions = goal.category ? getUnitsForCategory(goal.category.name) : [];

  // Reset displayUnit when the goal's unit changes
  useEffect(() => {
    setDisplayUnit(goal.unit);
  }, [goal.unit]);

  const color = getProgressColor(goal);
  const hex = colorHexMap[color];
  const barValue = Math.min(goal.percentage, 100);
  // Show on-track indicator for any goal that has a pacing expectation
  const showPacing = goal.on_track !== null;

  const baseLabel = getMonthlyLabel(goal);
  const derivedLabel = goal.category ? `${goal.category.name}: ${baseLabel}` : baseLabel;

  const monthly = getMonthlyDisplay(goal);
  const approx = monthly.isApprox ? '~' : '';

  // Apply display unit conversion if user has toggled to a different unit
  const categoryName = goal.category?.name ?? '';
  const displayMonthly = displayUnit !== monthly.unit
    ? {
        ...monthly,
        current: convertUnit(monthly.current, monthly.unit, displayUnit, categoryName),
        monthlyTarget: convertUnit(monthly.monthlyTarget, monthly.unit, displayUnit, categoryName),
        expected: monthly.expected !== null
          ? convertUnit(monthly.expected, monthly.unit, displayUnit, categoryName)
          : null,
        unit: displayUnit,
      }
    : monthly;

  const displayCurrentValue = goal.goal_type === 'measurement' && displayUnit !== goal.unit
    ? convertUnit(goal.current_value, goal.unit, displayUnit, categoryName)
    : goal.current_value;
  const displayTargetValue = goal.goal_type === 'measurement' && displayUnit !== goal.unit
    ? convertUnit(goal.target_value, goal.unit, displayUnit, categoryName)
    : goal.target_value;
  const displayExpected = goal.goal_type === 'measurement' && monthly.expected !== null && displayUnit !== goal.unit
    ? convertUnit(monthly.expected, goal.unit, displayUnit, categoryName)
    : monthly.expected;

  return (
    <>
      <Card
        sx={{
          cursor: 'pointer',
          opacity: readOnly ? 0.85 : 1,
          borderLeft: `4px solid ${hex}`,
          borderRadius: 2,
          transition: 'box-shadow 0.2s ease, opacity 0.2s',
          '&:hover': { boxShadow: 3 },
        }}
        onClick={() => setDrawerOpen(true)}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          {/* Header: category-prefixed monthly label */}
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ lineHeight: 1.3, mb: goal.title ? 0.25 : 1.25 }}
          >
            {derivedLabel}
          </Typography>

          {/* Note (user-set title) */}
          {goal.title && (
            <Typography variant="caption" color="text.secondary" display="block" mb={1.25}>
              {goal.title}
            </Typography>
          )}

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

          {/* Bottom row: current/target (normalised) | on-track indicator */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {goal.goal_type === 'measurement'
                ? `${fmtValue(displayCurrentValue)} ${displayUnit} → ${fmtValue(displayTargetValue)} ${displayUnit}${
                    displayExpected !== null ? ` · ${fmtValue(displayExpected)} expected` : ''
                  }`
                : `${fmtValue(displayMonthly.current)} / ${approx}${fmtValue(displayMonthly.monthlyTarget)} ${displayMonthly.unit}${
                    displayMonthly.expected !== null ? ` · ${fmtValue(displayMonthly.expected)} expected` : ''
                  }`
              }
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

          {unitOptions.length > 1 && (
            <Box display="flex" justifyContent="flex-end" mt={0.5}>
              <Chip
                label={displayUnit}
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = unitOptions.indexOf(displayUnit);
                  setDisplayUnit(unitOptions[(idx + 1) % unitOptions.length]);
                }}
                sx={{ fontSize: '0.65rem', height: 18, cursor: 'pointer' }}
              />
            </Box>
          )}

          {!readOnly && (
            <Box onClick={(e) => e.stopPropagation()} mt={0.5}>
              <QuickLogButton goal={goal} />
            </Box>
          )}

          {/* Today's logged entries for this goal */}
          {goal.day_entries && goal.day_entries.length > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
              {selectedDay ? 'Today' : 'Logged'}:{' '}
              {goal.goal_type === 'accumulation'
                ? `+${fmtV(goal.day_entries.reduce((s, e) => s + Number(e.value), 0))} ${goal.unit}`
                : `${fmtV(Number(goal.day_entries[0].value))} ${goal.unit}`}
            </Typography>
          )}
        </CardContent>
      </Card>

      <ProgressHistoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        goal={goal}
        readOnly={readOnly}
      />
    </>
  );
}
