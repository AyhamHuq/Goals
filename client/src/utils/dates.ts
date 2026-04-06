import { format, parse, isToday, isYesterday, getDaysInMonth, parseISO, differenceInDays, isSameDay } from 'date-fns';

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

/** '2026-04-05' → 'Sunday, Apr 5' */
export function formatDayLabel(dayKey: string): string {
  const d = new Date(dayKey + 'T00:00:00Z');
  if (isSameDay(d, new Date()) ) return `Today, ${format(d, 'MMM d')}`;
  return format(d, 'EEEE, MMM d');
}

/** '2026-04-05' → 'Apr 5' */
export function formatDayLabelShort(dayKey: string): string {
  const d = new Date(dayKey + 'T00:00:00Z');
  return format(d, 'MMM d');
}

export function formatLoggedFor(date: string): string {
  // node-postgres returns DATE as a JS Date, which JSON-serialises to an ISO
  // string like "2026-04-04T00:00:00.000Z". Strip the time part if present.
  const datePart = date.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}
