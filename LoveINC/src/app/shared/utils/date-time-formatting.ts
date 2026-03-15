import { format } from 'date-fns';

/**
 * Format a time range compactly for display.
 * - On the hour: "6 PM" not "6:00 PM"
 * - Both AM or both PM: "8:30-9:30 PM" not "8:30 PM - 9:30 PM"
 */
export function formatTimeRangeCompact(start: Date, end: Date): string {
  const sh = start.getHours();
  const sm = start.getMinutes();
  const eh = end.getHours();
  const em = end.getMinutes();

  const fmt = (d: Date, omitMinutesIfZero: boolean) => {
    const h = d.getHours();
    const m = d.getMinutes();
    const period = h >= 12 ? 'pm' : 'am';
    const hour12 = h % 12 || 12;
    if (omitMinutesIfZero && m === 0) {
      return `${hour12} ${period}`;
    }
    const min = m.toString().padStart(2, '0');
    return `${hour12}:${min} ${period}`;
  };

  const startOnHour = sm === 0;
  const endOnHour = em === 0;
  const samePeriod = (sh >= 12) === (eh >= 12);

  const startStr = fmt(start, startOnHour);
  const endStr = fmt(end, endOnHour);

  if (start.getTime() === end.getTime()) {
    return startStr;
  }

  if (samePeriod) {
    const period = sh >= 12 ? 'pm' : 'am';
    const startPart = startOnHour ? `${sh % 12 || 12}` : `${sh % 12 || 12}:${sm.toString().padStart(2, '0')}`;
    const endPart = endOnHour ? `${eh % 12 || 12}` : `${eh % 12 || 12}:${em.toString().padStart(2, '0')}`;
    return `${startPart}-${endPart} ${period}`;
  }

  return `${startStr}-${endStr}`;
}

/**
 * Format event dates for compact display (e.g. CTA cards).
 * - Single day: "Thu, May 21, 6 - 8pm" (not "Thu, May 21 - May 21 6:00 PM - 8:00 PM")
 * - Multi-day: "Thu, May 21 – Fri, May 22, 6-8pm"
 */
export function formatEventDatesCompact(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return '';
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (!start && !end) return '';

  const dateStr =
    start && end && isSameDay(start, end)
      ? format(start, 'EEE, MMM d')
      : start && end
        ? `${format(start, 'EEE, MMM d')} – ${format(end, 'EEE, MMM d')}`
        : start
          ? format(start, 'EEE, MMM d')
          : end
            ? format(end, 'EEE, MMM d')
            : '';

  const timeStr =
    start && end && start.getTime() !== end.getTime()
      ? `, ${formatTimeRangeCompact(start, end)}`
      : start
        ? `, ${formatTimeRangeCompact(start, start)}`
        : '';

  return `${dateStr}${timeStr}`.trim();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Format a time string from the API (e.g. "10:00 – 12:00" or "10:00 AM – 12:00 PM") to compact form.
 * Returns "10-12pm" or "8:30-9:30 PM" etc.
 */
export function formatTimeStringCompact(timeStr: string): string {
  if (!timeStr?.trim()) return '';
  const parts = timeStr.split(/\s*[-–]\s*/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return timeStr;

  const parsePart = (s: string): { h: number; m: number } | null => {
    const amPm = s.match(/\s*(AM|PM)\s*$/i);
    const numMatch = s.match(/(\d{1,2}):(\d{2})/);
    if (!numMatch) return null;
    let h = parseInt(numMatch[1], 10);
    const m = parseInt(numMatch[2], 10);
    if (amPm) {
      if (amPm[1].toUpperCase() === 'PM' && h < 12) h += 12;
      if (amPm[1].toUpperCase() === 'AM' && h === 12) h = 0;
    }
    // No AM/PM = 24hr format (10 = 10am, 18 = 6pm)
    return { h, m };
  };

  const start = parsePart(parts[0]);
  const end = parsePart(parts[1]);
  if (!start || !end) return timeStr;

  const ref = new Date(2000, 0, 1);
  const startDate = new Date(ref);
  startDate.setHours(start.h, start.m, 0, 0);
  const endDate = new Date(ref);
  endDate.setHours(end.h, end.m, 0, 0);
  return formatTimeRangeCompact(startDate, endDate);
}

/**
 * Format a date range without times (e.g. for class nextSession when no time).
 */
export function formatDateRangeCompact(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return '';
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (!start && !end) return '';
  return start && end
    ? `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    : start
      ? format(start, 'MMM d, yyyy')
      : end
        ? format(end, 'MMM d, yyyy')
        : '';
}
