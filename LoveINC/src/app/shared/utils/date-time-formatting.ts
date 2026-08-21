import { format, parse, addDays } from 'date-fns';

/**
 * U+00B7 with spaces. App-wide inline separator for date ranges, time ranges, and
 * multi-part card lines. Change this constant only to update that presentation everywhere.
 */
export const APP_DOT = ' · ' as const;

/** Fallback until the organization API returns the affiliate zone. */
export const DEFAULT_DISPLAY_TIME_ZONE = 'America/Los_Angeles';

let displayTimeZone = DEFAULT_DISPLAY_TIME_ZONE;

/** Affiliate IANA zone from GrovLink (in-person wall clock). */
export function setDisplayTimeZone(timeZone: string | null | undefined): void {
  const trimmed = timeZone?.trim();
  if (trimmed) displayTimeZone = trimmed;
}

export function getDisplayTimeZone(): string {
  return displayTimeZone;
}

export type DateDisplayOptions = {
  /** When true, show the viewer's local time instead of the affiliate wall clock. */
  remoteAccess?: boolean;
};

const UTC_MIDNIGHT_ISO = /^\d{4}-\d{2}-\d{2}T00:00:00(\.\d+)?Z$/i;

export function isUtcDateOnlyIso(iso: string): boolean {
  return UTC_MIDNIGHT_ISO.test(iso.trim());
}

function tzParts(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  timeZone: string
): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    ...options,
  }).formatToParts(date);
  const out: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') out[p.type] = p.value;
  }
  return out;
}

/**
 * Convert a GrovLink ISO string into a Date whose local Y/M/D/H/M match the
 * affiliate wall clock (or the device clock when remoteAccess is on).
 * UTC midnight stamps stay calendar dates, not 5pm.
 */
export function apiIsoToDisplayDate(
  iso: string,
  opts?: DateDisplayOptions
): Date {
  const trimmed = iso.trim();
  const instant = new Date(trimmed);
  if (Number.isNaN(instant.getTime())) return instant;
  if (isUtcDateOnlyIso(trimmed)) {
    const [y, m, d] = trimmed.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }
  if (opts?.remoteAccess) {
    return instant;
  }
  const p = tzParts(
    instant,
    {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    },
    displayTimeZone
  );
  let hour = Number(p['hour']);
  const period = (p['dayPeriod'] ?? '').toLowerCase();
  if (period.startsWith('p') && hour < 12) hour += 12;
  if (period.startsWith('a') && hour === 12) hour = 0;
  return new Date(
    Number(p['year']),
    Number(p['month']) - 1,
    Number(p['day']),
    hour,
    Number(p['minute']),
    Number(p['second'] ?? 0)
  );
}

function parseApiIso(
  iso: string | undefined,
  opts?: DateDisplayOptions
): Date | null {
  if (!iso?.trim()) return null;
  const d = apiIsoToDisplayDate(iso, opts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoHasWallClockTime(iso: string | undefined): boolean {
  return !!iso?.trim() && !isUtcDateOnlyIso(iso.trim());
}

/** 12hr time from a GrovLink ISO instant (affiliate zone, or viewer when remote). */
export function formatIsoTime12hr(
  isoDate: string,
  opts?: DateDisplayOptions
): string {
  const d = apiIsoToDisplayDate(isoDate, opts);
  if (Number.isNaN(d.getTime()) || isUtcDateOnlyIso(isoDate.trim())) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')}${period}`;
}

/**
 * Join non-empty string parts with {@link APP_DOT} (e.g. schedule + address, or start + end time fields).
 */
export function joinWithAppDot(...parts: (string | null | undefined)[]): string {
  return parts
    .filter((p) => p != null && String(p).trim() !== '')
    .map((p) => String(p).trim())
    .join(APP_DOT);
}

/**
 * "May 21 · May 30, 2026" for class/schedule list rows (month/day on left, month/day + year on right).
 */
export function formatClassListDateRange(start: Date, end: Date): string {
  return `${format(start, 'MMM d')}${APP_DOT}${format(end, 'MMM d, yyyy')}`;
}

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
 * - Both AM or both PM: "8:30 · 9:30 PM" not "8:30 PM - 9:30 PM"
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
    return `${startPart}${APP_DOT}${endPart} ${period}`;
  }

  return `${startStr}${APP_DOT}${endStr}`;
}

/**
 * Format event dates for compact display (e.g. CTA cards).
 * - Single day: "Thu, May 21, 6 - 8pm" (not "Thu, May 21 - May 21 6:00 PM - 8:00 PM")
 * - Multi-day: "Thu, May 21 · Fri, May 22, 6 · 8pm"
 */
export function formatEventDatesCompact(
  startDate: string,
  endDate: string,
  opts?: DateDisplayOptions
): string {
  if (!startDate && !endDate) return '';
  const start = parseApiIso(startDate, opts);
  const end = parseApiIso(endDate, opts);
  if (!start && !end) return '';
  const showTime = isoHasWallClockTime(startDate) || isoHasWallClockTime(endDate);

  const dateStr = uppercaseMonth(
    start && end && isSameDay(start, end)
      ? format(start, 'EEE, MMM d')
      : start && end
        ? `${format(start, 'EEE, MMM d')}${APP_DOT}${format(end, 'EEE, MMM d')}`
        : start
          ? format(start, 'EEE, MMM d')
          : end
            ? format(end, 'EEE, MMM d')
            : ''
  );

  const timeStr =
    showTime && start && end && start.getTime() !== end.getTime()
      ? `, ${formatTimeRangeCompact(start, end)}`
      : showTime && start
        ? `, ${formatTimeRangeCompact(start, start)}`
        : '';

  return `${dateStr}${timeStr}`.trim();
}

/**
 * Format a time string from the API (e.g. "10:00 · 12:00" or "10:00 AM - 12:00 PM") to compact form.
 * Returns "10-12pm" or "8:30-9:30 PM" etc.
 */
export function formatTimeStringCompact(timeStr: string): string {
  if (!timeStr?.trim()) return '';
  const parts = timeStr.split(/\s*[-–·]\s*/).map((s) => s.trim()).filter(Boolean);
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
 * Single day: "May 21, 2026" (never "May 21 · May 21, 2026").
 * Multi-day: "May 21 · May 22, 2026".
 */
export function formatDateRangeCompact(
  startDate: string,
  endDate: string,
  opts?: DateDisplayOptions
): string {
  if (!startDate && !endDate) return '';
  const start = parseApiIso(startDate, opts);
  const end = parseApiIso(endDate, opts);
  if (!start && !end) return '';
  if (start && end && isSameDay(start, end)) {
    return uppercaseMonth(format(start, 'MMM d, yyyy'));
  }
  return start && end
    ? uppercaseMonth(`${format(start, 'MMM d')}${APP_DOT}${format(end, 'MMM d, yyyy')}`)
    : start
      ? uppercaseMonth(format(start, 'MMM d, yyyy'))
      : end
        ? uppercaseMonth(format(end, 'MMM d, yyyy'))
        : '';
}

/**
 * Format event dates for card/detail subtitle.
 * Line 1: weekday + date (or date range). Line 2: time range (when time applies).
 * Single day: "FRIDAY, MARCH 16, 2026\n6:00 · 8:00 PM"
 * Multi-day: "FRIDAY, MARCH 16 · MARCH 17, 2026\n6:00 · 8:00 PM"
 */
export function formatEventSubtitle(
  startDate?: string,
  endDate?: string,
  opts?: DateDisplayOptions
): string {
  if (!startDate && !endDate) return '';
  const start = parseApiIso(startDate, opts);
  const end = parseApiIso(endDate, opts);
  if (!start && !end) return '';
  const showTime = isoHasWallClockTime(startDate) || isoHasWallClockTime(endDate);

  const dayStr = start ? format(start, 'EEEE').toUpperCase() : '';
  const dateStr = uppercaseMonth(
    start && end && isSameDay(start, end)
      ? format(start, 'MMMM d, yyyy')
      : start && end
        ? `${format(start, 'MMM d')}${APP_DOT}${format(end, 'MMM d, yyyy')}`
        : start
          ? format(start, 'MMMM d, yyyy')
          : end
            ? format(end, 'MMMM d, yyyy')
            : ''
  );

  const timeStr = showTime && start ? format(start, 'h:mm a') : '';
  const timeRange =
    showTime && end && start && start.getTime() !== end.getTime()
      ? formatTimeRangeFull(format(start, 'h:mm a'), format(end, 'h:mm a'))
      : timeStr;

  if (timeRange && dayStr && start) {
    return `${dayStr}, ${dateStr}\n${timeRange}`;
  }
  return dateStr;
}

/** Format two time strings as "6:00 · 8:00 PM" (drops redundant AM/PM when same period). */
export function formatTimeRangeFull(start: string, end: string): string {
  const endMatch = end.match(/\s(AM|PM)$/);
  if (endMatch && start.endsWith(` ${endMatch[1]}`)) {
    return `${start.replace(/\s(AM|PM)$/, '')}${APP_DOT}${end}`;
  }
  return `${start}${APP_DOT}${end}`;
}

/**
 * Parse API time string (24hr "18:00 - 20:00" or 12hr) to full form "6:00 · 8:00 PM".
 */
export function formatTimeStringFull(timeStr: string): string {
  if (!timeStr?.trim()) return timeStr;
  const ref = new Date(2000, 0, 1);
  const parts = timeStr.split(/\s*[-–·]\s*|\s+to\s+/i).map((s) => s.trim()).filter(Boolean);
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
          .join(APP_DOT);
      }
    }
  }
  return formatted.join(APP_DOT);
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

function wallClockInTimeZoneToUtc(
  ymd: string,
  hms: string,
  timeZone: string
): Date {
  const desired = `${ymd}T${hms}`;
  let utcMs = Date.parse(`${desired}Z`);
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  for (let i = 0; i < 4; i++) {
    const parts = dtf.formatToParts(new Date(utcMs));
    const g = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
    const got = `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}`;
    utcMs += Date.parse(`${desired}Z`) - Date.parse(`${got}Z`);
  }
  return new Date(utcMs);
}

function formatClockStringForViewer(timeStr: string, dateIso: string): string {
  const ymd = dateIso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return formatTimeStringFull(timeStr);
  const parts = timeStr.split(/\s*[-–·]\s*|\s+to\s+/i).map((s) => s.trim()).filter(Boolean);
  const formatted = parts.map((part) => {
    const match = part.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return formatTimeStringFull(part);
    const hms = `${match[1].padStart(2, '0')}:${match[2]}:00`;
    const instant = wallClockInTimeZoneToUtc(ymd, hms, displayTimeZone);
    return format(instant, 'h:mm a');
  });
  if (formatted.length >= 2) {
    return formatTimeRangeFull(formatted[0], formatted[formatted.length - 1]);
  }
  return formatted[0] ?? timeStr;
}

export function formatSessionTime(
  timeStr: string,
  dateIso: string,
  opts?: DateDisplayOptions
): string {
  if (!timeStr?.trim()) return '';
  return opts?.remoteAccess
    ? formatClockStringForViewer(timeStr, dateIso)
    : formatTimeStringFull(timeStr);
}

/**
 * Format class session for card/detail subtitle.
 * Line 1: date range. Line 2: day + time (when time is present).
 * "May 21, 2026\nFR 6:00 · 8:00 PM" or "May 21 · May 22, 2026\nFR 6:00 · 8:00 PM"
 */
export function formatClassSessionSubtitle(
  session: {
    startDate: string;
    endDate: string;
    dayOfWeek: string;
    time: string;
  },
  opts?: DateDisplayOptions
): string {
  const dateRange = formatDateRangeCompact(session.startDate, session.endDate, opts);
  const time12hr = session.time
    ? opts?.remoteAccess
      ? formatClockStringForViewer(session.time, session.startDate)
      : formatTimeStringFull(session.time)
    : '';
  const dayAbbr = dayTo2Letter(session.dayOfWeek);
  return time12hr ? `${dateRange}\n${dayAbbr} ${time12hr}` : dateRange;
}
