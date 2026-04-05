import { GoalWithProgress } from '../types';
import { UNIT_CONVERSIONS } from '../constants/unitConversions';

export function getFrequencyLabel(
  frequencyType: string,
  targetValue: number,
  unit: string
): string {
  switch (frequencyType) {
    case 'total':
      return `${targetValue} ${unit} total`;
    case 'daily':
      return `${targetValue} ${unit}/day`;
    case 'weekly':
      return `${targetValue} ${unit}/week`;
    default:
      return `${targetValue} ${unit}`;
  }
}

export function formatPercentage(value: number): string {
  const capped = Math.min(Math.round(value), 100);
  return `${capped}%`;
}

// ── Monthly normalisation ─────────────────────────────────────────────────────

// Approximate constants used for display-only normalisation.
// Exact values vary by month; approximations are fine for a "~X/month" label.
const APPROX_DAYS = 30;
const APPROX_WEEKS = Math.ceil(APPROX_DAYS / 7); // 5

/** Raw monthly total in the goal's stored unit (no unit conversion). */
export function getMonthlyTotal(frequencyType: string, targetValue: number): number {
  switch (frequencyType) {
    case 'daily':  return targetValue * APPROX_DAYS;
    case 'weekly': return targetValue * APPROX_WEEKS;
    default:       return targetValue; // 'total' — already a monthly amount
  }
}

/**
 * Convert minutes → hours when the monthly total reaches ≥ 60 minutes.
 * Returns the value unchanged for any other unit.
 */
function scaleMinutesToHours(
  value: number,
  unit: string,
): { value: number; unit: string } {
  const lower = unit.toLowerCase();
  if ((lower === 'minutes' || lower === 'mins') && value >= 60) {
    return { value: Math.round(value / 6) / 10, unit: 'hours' };
  }
  return { value, unit };
}

/**
 * Auto-scale a value to a more readable unit using the category's unit conversion map.
 * Picks the largest unit where the converted value is >= 1.
 * Falls back to scaleMinutesToHours for unknown categories.
 */
function scaleForDisplay(
  value: number,
  unit: string,
  categoryName: string | null | undefined,
): { value: number; unit: string } {
  if (!categoryName) return scaleMinutesToHours(value, unit);
  const map = UNIT_CONVERSIONS[categoryName];
  if (!map) return scaleMinutesToHours(value, unit);

  const currentFactor = map.toBase[unit];
  if (!currentFactor) return { value, unit };

  const valueInBase = value * currentFactor;
  // Sort units ascending by their toBase factor (smaller units first)
  const sortedBySize = map.units
    .filter((u) => map.toBase[u] !== undefined)
    .sort((a, b) => map.toBase[a] - map.toBase[b]);

  let best = { value, unit };
  for (const candidate of sortedBySize) {
    const candidateValue = valueInBase / map.toBase[candidate];
    if (candidateValue >= 1) {
      best = { value: Math.round(candidateValue * 10) / 10, unit: candidate };
    }
  }
  return best;
}

/** Format a display number: integer when whole, 1 decimal otherwise. */
export function fmtValue(n: number): string {
  if (n === Math.floor(n)) return String(n);
  return n.toFixed(1);
}

export interface MonthlyDisplay {
  /** Monthly-equivalent target, possibly scaled (e.g. minutes → hours). */
  monthlyTarget: number;
  /** Current value in the same (possibly scaled) unit. */
  current: number;
  /** Pace-expected value in the same unit, or null. */
  expected: number | null;
  /** Display unit after any scaling. */
  unit: string;
  /** True for daily/weekly goals (show "~" prefix in labels). */
  isApprox: boolean;
}

/**
 * Returns values normalised for a "single point of comparison":
 * - daily/weekly goals scale to a monthly total
 * - minutes scale to hours when the monthly total ≥ 60
 * - measurement goals pass through unchanged
 */
export function getMonthlyDisplay(goal: GoalWithProgress): MonthlyDisplay {
  if (goal.goal_type === 'measurement') {
    return {
      monthlyTarget: goal.target_value,
      current: goal.current_value,
      expected: goal.expected_value,
      unit: goal.unit,
      isApprox: false,
    };
  }

  const rawMonthly = getMonthlyTotal(goal.frequency_type, goal.target_value);
  const { value: monthlyTarget, unit } = scaleForDisplay(rawMonthly, goal.unit, goal.category?.name);

  // If unit changed (minutes → hours), scale current and expected by the same factor
  const scale = monthlyTarget / rawMonthly;
  return {
    monthlyTarget,
    current: goal.current_value * scale,
    expected: goal.expected_value !== null ? goal.expected_value * scale : null,
    unit,
    isApprox: goal.frequency_type !== 'total',
  };
}

/**
 * Short heading label using the monthly-normalised view.
 * Examples: "~100 lectures/month", "~15 hours/month", "Target: 150 lbs"
 */
export function getMonthlyLabel(goal: GoalWithProgress): string {
  if (goal.goal_type === 'measurement') {
    return `Target: ${goal.target_value} ${goal.unit}`;
  }
  const { monthlyTarget, unit, isApprox } = getMonthlyDisplay(goal);
  return `${isApprox ? '~' : ''}${fmtValue(monthlyTarget)} ${unit}/month`;
}
