import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { GoalWithProgress } from '../../types';
import { formatPercentage, getMonthlyDisplay, getMonthlyLabel, fmtValue } from '../../utils/frequency';
import { getUnitsForCategory, convertUnit } from '../../constants/unitConversions';
import { fmtValue as fmtV } from '../../utils/frequency';
import QuickLogButton from '../progress/QuickLogButton';
import ProgressHistoryDrawer from '../progress/ProgressHistoryDrawer';
import CircularProgressRing from '../shared/CircularProgressRing';
import { PACING_HEX, PACING_GRADIENT } from '../../theme/tokens';
import { GOAL_TEMPLATES } from '../../constants/goalTemplates';

interface GoalCardProps {
  goal: GoalWithProgress & { id: string };
  readOnly?: boolean;
  selectedDay?: string;
  animationDelay?: number;
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

function getCategoryIcon(categoryName: string | undefined): string | undefined {
  if (!categoryName) return undefined;
  const template = GOAL_TEMPLATES.find((t) => t.label.toLowerCase() === categoryName.toLowerCase());
  return template?.icon;
}

export default function GoalCard({ goal, readOnly = false, selectedDay, animationDelay = 0 }: GoalCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [displayUnit, setDisplayUnit] = useState(goal.unit);
  const unitOptions = goal.category ? getUnitsForCategory(goal.category.name) : [];

  useEffect(() => {
    setDisplayUnit(goal.unit);
  }, [goal.unit]);

  const color = getProgressColor(goal);
  const hex = PACING_HEX[color];
  const gradient = PACING_GRADIENT[color];
  const barValue = Math.min(goal.percentage, 100);
  const showPacing = goal.on_track !== null;
  const categoryIcon = getCategoryIcon(goal.category?.name);

  const baseLabel = getMonthlyLabel(goal);
  // Include category prefix in label (tested behavior)
  const derivedLabel = goal.category ? `${goal.category.name}: ${baseLabel}` : baseLabel;
  const goalTitle = goal.title ? goal.title : undefined;

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

  // Track color in light/dark
  const trackColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <>
      <Card
        onClick={() => setDrawerOpen(true)}
        sx={{
          cursor: 'pointer',
          opacity: readOnly ? 0.88 : 1,
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          animation: `fadeSlideUp 350ms ease-out ${animationDelay}ms both`,
          '@keyframes fadeSlideUp': {
            from: { opacity: 0, transform: 'translateY(14px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
          // Subtle status-tinted background
          background: isDark
            ? `linear-gradient(135deg, ${alpha(hex, 0.06)} 0%, transparent 55%), ${theme.palette.background.paper}`
            : `linear-gradient(135deg, ${alpha(hex, 0.04)} 0%, transparent 55%), ${theme.palette.background.paper}`,
          '&:hover': {
            boxShadow: `0 4px 16px ${alpha(hex, isDark ? 0.25 : 0.15)}, 0 12px 32px rgba(0,0,0,${isDark ? 0.3 : 0.07})`,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'scale(0.975) translateY(0)',
            transition: 'transform 0.12s cubic-bezier(0.2,0.8,0.2,1)',
          },
          transition: 'box-shadow 0.25s ease, transform 0.18s ease',
        }}
      >
        {/* Left accent stripe */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 4,
            background: gradient,
            borderRadius: '20px 0 0 20px',
          }}
        />

        <CardContent
          sx={{
            pb: '14px !important',
            pt: 2,
            pl: 2.5,
            pr: 2,
            minHeight: 140,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header row: category icon + label + ring */}
          <Box display="flex" alignItems="flex-start" gap={1.25} mb={1}>
            {/* Category icon */}
            {categoryIcon && (
              <Box
                sx={{
                  fontSize: 22,
                  lineHeight: 1,
                  flexShrink: 0,
                  mt: 0.15,
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))',
                }}
              >
                {categoryIcon}
              </Box>
            )}

            {/* Label + subtitle */}
            <Box flex={1} minWidth={0} mr={1}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {derivedLabel}
              </Typography>
              {goalTitle && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 0.2, lineHeight: 1.35 }}
                >
                  {goalTitle}
                </Typography>
              )}
            </Box>

            {/* Circular progress ring */}
            <CircularProgressRing
              value={barValue}
              size={62}
              strokeWidth={5}
              color={hex}
              trackColor={trackColor}
            >
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: hex,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {formatPercentage(goal.percentage)}
              </Typography>
            </CircularProgressRing>
          </Box>

          {/* Pacing status */}
          {showPacing && (
            <Box display="flex" alignItems="center" gap={0.5} mb={0.75}>
              {goal.on_track ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 13, color: hex }} />
              ) : (
                <WarningRoundedIcon sx={{ fontSize: 13, color: hex }} />
              )}
              <Typography
                variant="caption"
                sx={{ color: hex, fontWeight: 700, fontSize: '0.7rem' }}
              >
                {goal.on_track ? 'On track' : 'Behind'}
              </Typography>
            </Box>
          )}

          {/* Values text */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, fontSize: '0.72rem', lineHeight: 1.45 }}
          >
            {goal.goal_type === 'measurement'
              ? `${fmtValue(displayCurrentValue)} → ${fmtValue(displayTargetValue)} ${displayUnit}${
                  displayExpected !== null ? ` · ${fmtValue(displayExpected)} expected` : ''
                }`
              : `${fmtValue(displayMonthly.current)} / ${approx}${fmtValue(displayMonthly.monthlyTarget)} ${displayMonthly.unit}${
                  displayMonthly.expected !== null ? ` · ${fmtValue(displayMonthly.expected)} expected` : ''
                }`
            }
          </Typography>

          {/* Unit toggle chip */}
          {unitOptions.length > 1 && (
            <Box
              component="span"
              onClick={(e) => {
                e.stopPropagation();
                const idx = unitOptions.indexOf(displayUnit);
                setDisplayUnit(unitOptions[(idx + 1) % unitOptions.length]);
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                mb: 0.75,
                px: 1,
                py: 0.25,
                borderRadius: '100px',
                border: '1px solid',
                borderColor: 'divider',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'text.secondary',
                cursor: 'pointer',
                width: 'fit-content',
                '&:hover': { borderColor: 'text.secondary' },
              }}
            >
              {displayUnit} ↕
            </Box>
          )}

          {/* Thin progress bar at bottom */}
          <LinearProgress
            variant="determinate"
            value={barValue}
            sx={{
              height: 3,
              borderRadius: 4,
              mb: 1.25,
              bgcolor: trackColor,
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: gradient,
              },
            }}
          />

          {/* Bottom row: day entries + log button */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {goal.day_entries && goal.day_entries.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {selectedDay ? 'Today' : 'Logged'}:{' '}
                <Box component="span" sx={{ fontWeight: 700, color: hex }}>
                  {goal.goal_type === 'accumulation'
                    ? `+${fmtV(goal.day_entries.reduce((s, e) => s + Number(e.value), 0))} ${goal.unit}`
                    : `${fmtV(Number(goal.day_entries[0].value))} ${goal.unit}`}
                </Box>
              </Typography>
            )}
            {!readOnly && (
              <Box
                onClick={(e) => e.stopPropagation()}
                ml={goal.day_entries && goal.day_entries.length > 0 ? 'auto' : undefined}
              >
                <QuickLogButton goal={goal} accentColor={hex} accentGradient={gradient} />
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
