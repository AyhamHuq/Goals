import { getDaysInMonth, differenceInDays, parseISO, startOfMonth } from 'date-fns';
import { FrequencyType, GoalType } from '../types';

export interface CalcProgressResult {
  percentage: number;
  expectedValue: number | null;
  onTrack: boolean | null;
}

export function calcProgress(
  frequencyType: FrequencyType,
  currentValue: number,
  targetValue: number,
  periodKey: string, // 'YYYY-MM'
  referenceDate?: Date,
  goalType?: GoalType,
  startValue?: number,
): CalcProgressResult {
  if (goalType === 'measurement') {
    const start = startValue ?? currentValue;
    const span = Math.abs(start - targetValue);
    if (span === 0) return { percentage: 0, expectedValue: null, onTrack: null };
    const moved = Math.abs(start - currentValue);

    // Linear pacing: where should we be today?
    const monthStart = parseISO(`${periodKey}-01`);
    const daysInMonth = getDaysInMonth(monthStart);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const ref = referenceDate ?? new Date();
    const clampedRef = ref < monthStart ? monthStart : ref > monthEnd ? monthEnd : ref;
    const daysElapsed = differenceInDays(clampedRef, monthStart) + 1;
    const expectedValue = start + (targetValue - start) * (daysElapsed / daysInMonth);
    // On track: if reducing (target < start) current must be ≤ expected; else ≥
    const onTrack = targetValue < start
      ? currentValue <= expectedValue
      : currentValue >= expectedValue;

    return {
      percentage: (moved / span) * 100,
      expectedValue: Math.round(expectedValue * 100) / 100,
      onTrack,
    };
  }

  if (frequencyType === 'total') {
    const percentage = targetValue === 0 ? 0 : (currentValue / targetValue) * 100;
    return { percentage, expectedValue: null, onTrack: null };
  }

  // Parse period to get month start
  const monthStart = parseISO(`${periodKey}-01`);
  const daysInMonth = getDaysInMonth(monthStart);

  // Days elapsed: how many days into the month we are (minimum 1 so day 1 has 1 day elapsed)
  const ref = referenceDate ?? new Date();
  // Clamp ref to [monthStart, last day of month]
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const clampedRef = ref < monthStart ? monthStart : ref > monthEnd ? monthEnd : ref;
  const daysElapsed = differenceInDays(clampedRef, monthStart) + 1;

  if (frequencyType === 'daily') {
    const totalTarget = targetValue * daysInMonth;
    const expectedValue = targetValue * daysElapsed;
    const percentage = totalTarget === 0 ? 0 : (currentValue / totalTarget) * 100;
    const onTrack = currentValue >= expectedValue;
    return { percentage, expectedValue, onTrack };
  }

  // weekly
  const weeksInMonth = Math.ceil(daysInMonth / 7);
  const totalTarget = targetValue * weeksInMonth;
  const weeksElapsed = daysElapsed / 7;
  const expectedValue = targetValue * weeksElapsed;
  const percentage = totalTarget === 0 ? 0 : (currentValue / totalTarget) * 100;
  const onTrack = currentValue >= expectedValue;
  return { percentage, expectedValue, onTrack };
}
