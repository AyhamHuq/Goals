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

/** Parse a YYYY-MM-DD key into a local-timezone Date (midnight local) */
function parseDayKey(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** '2026-04-06' → 'Monday, Apr 6' (or 'Today, Apr 6') */
export function formatDayLabel(dayKey: string): string {
  const d = parseDayKey(dayKey);
  if (isSameDay(d, new Date())) return `Today, ${format(d, 'MMM d')}`;
  return format(d, 'EEEE, MMM d');
}

/** '2026-04-06' → 'Apr 6' */
export function formatDayLabelShort(dayKey: string): string {
  return format(parseDayKey(dayKey), 'MMM d');
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
