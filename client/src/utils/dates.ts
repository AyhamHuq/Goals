import { format, parse, isToday, isYesterday } from 'date-fns';

export function periodKeyToLabel(periodKey: string): string {
  const date = parse(periodKey, 'yyyy-MM', new Date());
  return format(date, 'MMMM yyyy');
}

export function formatLoggedFor(date: string): string {
  // date is YYYY-MM-DD — parse without timezone shift
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}
