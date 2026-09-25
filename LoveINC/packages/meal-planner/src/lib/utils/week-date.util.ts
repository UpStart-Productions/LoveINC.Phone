import { addDays, format, startOfDay } from 'date-fns';

export function getSundayForDate(d: Date): Date {
  const copy = startOfDay(d);
  const day = copy.getDay();
  return addDays(copy, -day);
}

export function getCurrentWeekStart(): string {
  return format(getSundayForDate(new Date()), 'yyyy-MM-dd');
}

export function formatWeekLabel(weekStartDate: string): string {
  const sunday = new Date(`${weekStartDate}T00:00:00`);
  const saturday = addDays(sunday, 6);
  return `${format(sunday, 'MMM d')} – ${format(saturday, 'MMM d')}`;
}
