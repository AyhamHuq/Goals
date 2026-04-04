import { format, parse, isToday, isYesterday, getDaysInMonth, parseISO, differenceInDays } from 'date-fns';

export function periodKeyToLabel(periodKey: string): string {
  const date = parse(periodKey, 'yyyy-MM', new Date());
  return format(date, 'MMMM yyyy');
}

/**
 * Returns what percentage of the month has elapsed as of today, clamped to
 * [0, 100]. Used to decide whether a non-paced (total/measurement) goal is
 * "on track" relative to time spent.
 */
export function periodProportionalThreshold(periodKey: string): number {
  const monthStart = parseISO(`${periodKey}-01`);
  const daysInMonth = getDaysInMonth(monthStart);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const ref = new Date();
  const clamped = ref < monthStart ? monthStart : ref > monthEnd ? monthEnd : ref;
  const daysElapsed = differenceInDays(clamped, monthStart) + 1;
  return (daysElapsed / daysInMonth) * 100;
}

export function formatLoggedFor(date: string): string {
  // date is YYYY-MM-DD — parse without timezone shift
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}
