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

  useEffect(() => {
    setDisplayUnit(goal.unit);
  }, [goal.unit]);

  const color = getProgressColor(goal);
  const hex = colorHexMap[color];
  const barValue = Math.min(goal.percentage, 100);
  const showPacing = goal.on_track !== null;

  const baseLabel = getMonthlyLabel(goal);
  const derivedLabel = goal.category ? `${goal.category.name}: ${baseLabel}` : baseLabel;

  const monthly = getMonthlyDisplay(goal);
  const approx = monthly.isApprox ? '~' : '';

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
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
          '&:active': { transform: 'scale(0.98)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: hex,
            borderRadius: '12px 12px 0 0',
          },
        }}
        onClick={() => setDrawerOpen(true)}
      >
        <CardContent sx={{ pb: '14px !important', pt: 2.5, minHeight: 160, display: 'flex', flexDirection: 'column' }}>
          {/* Header: label + on-track badge */}
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={goal.title ? 0.25 : 1}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ lineHeight: 1.3, flex: 1, mr: 1 }}
            >
              {derivedLabel}
            </Typography>
            {showPacing && (
              <Chip
                icon={goal.on_track
                  ? <CheckCircleOutlineIcon sx={{ fontSize: 13, '&&': { ml: '6px' } }} />
                  : <HighlightOffIcon sx={{ fontSize: 13, '&&': { ml: '6px' } }} />
                }
                label={goal.on_track ? 'On track' : 'Behind'}
                size="small"
                sx={{
                  bgcolor: alpha(goal.on_track ? colorHexMap.success : colorHexMap.error, 0.1),
                  color: goal.on_track ? colorHexMap.success : colorHexMap.error,
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  height: 22,
                  borderRadius: '11px',
                  flexShrink: 0,
                }}
              />
            )}
          </Box>

          {/* Note */}
          {goal.title && (
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              {goal.title}
            </Typography>
          )}

          {/* Progress bar + large percentage */}
          <Box display="flex" alignItems="center" gap={2} mb={0.75}>
            <LinearProgress
              variant="determinate"
              value={barValue}
              color={color}
              sx={{ flex: 1, height: 10, borderRadius: 6 }}
            />
            <Typography
              fontWeight={800}
              sx={{ color: hex, fontSize: '1.05rem', minWidth: 46, textAlign: 'right', lineHeight: 1 }}
            >
              {formatPercentage(goal.percentage)}
            </Typography>
          </Box>

          {/* Current/target values */}
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

          {/* Unit toggle */}
          {unitOptions.length > 1 && (
            <Box display="flex" mt={0.75}>
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

          {/* Spacer pushes button row to bottom */}
          <Box flex={1} />

          {/* Bottom row: day entries + log button */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
            {goal.day_entries && goal.day_entries.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {selectedDay ? 'Today' : 'Logged'}:{' '}
                {goal.goal_type === 'accumulation'
                  ? `+${fmtV(goal.day_entries.reduce((s, e) => s + Number(e.value), 0))} ${goal.unit}`
                  : `${fmtV(Number(goal.day_entries[0].value))} ${goal.unit}`}
              </Typography>
            )}
            {!readOnly && (
              <Box onClick={(e) => e.stopPropagation()} ml={goal.day_entries && goal.day_entries.length > 0 ? 'auto' : undefined}>
                <QuickLogButton goal={goal} />
              </Box>
            )}
          </Box>
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
