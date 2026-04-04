import { getDaysInMonth, differenceInDays, parseISO, startOfMonth } from 'date-fns';
import { FrequencyType } from '../types';

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
): CalcProgressResult {
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
