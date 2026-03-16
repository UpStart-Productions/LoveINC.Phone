import { format, parse, addDays } from 'date-fns';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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

  const dateStr = uppercaseMonth(
    start && end && isSameDay(start, end)
      ? format(start, 'EEE, MMM d')
      : start && end
        ? `${format(start, 'EEE, MMM d')} – ${format(end, 'EEE, MMM d')}`
        : start
          ? format(start, 'EEE, MMM d')
          : end
            ? format(end, 'EEE, MMM d')
            : ''
  );

  const timeStr =
    start && end && start.getTime() !== end.getTime()
      ? `, ${formatTimeRangeCompact(start, end)}`
      : start
        ? `, ${formatTimeRangeCompact(start, start)}`
        : '';

  return `${dateStr}${timeStr}`.trim();
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
 * Single day: "May 21, 2026" (never "May 21 – May 21, 2026").
 * Multi-day: "May 21 – May 22, 2026".
 */
export function formatDateRangeCompact(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return '';
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (!start && !end) return '';
  if (start && end && isSameDay(start, end)) {
    return uppercaseMonth(format(start, 'MMM d, yyyy'));
  }
  return start && end
    ? uppercaseMonth(`${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`)
    : start
      ? uppercaseMonth(format(start, 'MMM d, yyyy'))
      : end
        ? uppercaseMonth(format(end, 'MMM d, yyyy'))
        : '';
}

/**
 * Format event dates for card/detail subtitle.
 * Single day: "FRIDAY, March 16, 2026 • 6:00 – 8:00 PM"
 * Multi-day: "FRIDAY, March 16 – March 17, 2026 • 6:00 – 8:00 PM"
 */
export function formatEventSubtitle(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return '';
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (!start && !end) return '';

  const dayStr = start ? format(start, 'EEEE').toUpperCase() : '';
  const dateStr = uppercaseMonth(
    start && end && isSameDay(start, end)
      ? format(start, 'MMMM d, yyyy')
      : start && end
        ? `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
        : start
          ? format(start, 'MMMM d, yyyy')
          : end
            ? format(end, 'MMMM d, yyyy')
            : ''
  );

  const timeStr = start ? format(start, 'h:mm a') : '';
  const timeRange =
    end && start && start.getTime() !== end.getTime()
      ? formatTimeRangeFull(format(start, 'h:mm a'), format(end, 'h:mm a'))
      : timeStr;

  if (timeRange && dayStr && start) {
    return `${dayStr}, ${dateStr} • ${timeRange}`;
  }
  return dateStr;
}

/** Format two time strings as "6:00 – 8:00 PM" (drops redundant AM/PM when same period). */
export function formatTimeRangeFull(start: string, end: string): string {
  const endMatch = end.match(/\s(AM|PM)$/);
  if (endMatch && start.endsWith(` ${endMatch[1]}`)) {
    return `${start.replace(/\s(AM|PM)$/, '')} – ${end}`;
  }
  return `${start} – ${end}`;
}

/**
 * Parse API time string (24hr "18:00 - 20:00" or 12hr) to full form "6:00 – 8:00 PM".
 */
export function formatTimeStringFull(timeStr: string): string {
  if (!timeStr?.trim()) return timeStr;
  const ref = new Date(2000, 0, 1);
  const parts = timeStr.split(/\s*[-–]\s*|\s+to\s+/i).map((s) => s.trim()).filter(Boolean);
  const formatted = parts.map((part) => {
    try {
      const d = parse(part, 'HH:mm', ref);
      return format(d, 'h:mm a');
    } catch {
      try {
        const d = parse(part, 'HH:mm:ss', ref);
        return format(d, 'h:mm a');
      } catch {
        return part;
      }
    }
  });
  if (formatted.length >= 2) {
    const last = formatted[formatted.length - 1];
    const periodMatch = last.match(/\s(AM|PM)$/);
    if (periodMatch) {
      const period = periodMatch[1];
      const allSame = formatted.every((f) => f.endsWith(` ${period}`));
      if (allSame) {
        return formatted
          .map((f, i) => (i < formatted.length - 1 ? f.replace(/\s(AM|PM)$/, '') : f))
          .join(' – ');
      }
    }
  }
  return formatted.join(' – ');
}

/** Uppercase month names in a date string (e.g. "March" -> "MARCH"). */
export function uppercaseMonth(str: string): string {
  return str.replace(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g,
    (m) => m.toUpperCase()
  );
}

/** "Friday" or "Fri" -> "FR". "Fr, Sa" -> "FR, SA". */
export function dayTo2Letter(day: string): string {
  return day
    .split(',')
    .map((d) => d.trim().replace(/s$/, '').slice(0, 2).toUpperCase())
    .filter(Boolean)
    .join(', ');
}

/** Day number (0=Sunday) -> 2-letter abbrev "SU", "FR", etc. */
export function dayNumberTo2Letter(n: number): string {
  const sun = new Date(2024, 0, 7);
  return format(addDays(sun, n), 'EEE').slice(0, 2).toUpperCase();
}

/**
 * Format class session for card/detail subtitle.
 * "FR 6:00 – 8:00 PM\nMay 21, 2026" or "FR 6:00 – 8:00 PM\nMay 21 – May 22, 2026"
 */
export function formatClassSessionSubtitle(session: {
  startDate: string;
  endDate: string;
  dayOfWeek: string;
  time: string;
}): string {
  const dateRange = formatDateRangeCompact(session.startDate, session.endDate);
  const time12hr = session.time ? formatTimeStringFull(session.time) : '';
  const dayAbbr = dayTo2Letter(session.dayOfWeek);
  return time12hr ? `${dayAbbr} ${time12hr}\n${dateRange}` : dateRange;
}
