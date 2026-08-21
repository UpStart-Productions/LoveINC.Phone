import {
  apiIsoToDisplayDate,
  formatEventSubtitle,
  formatIsoTime12hr,
  isUtcDateOnlyIso,
  setDisplayTimeZone,
} from './date-time-formatting';

describe('apiIsoToDisplayDate', () => {
  beforeEach(() => {
    setDisplayTimeZone('America/Los_Angeles');
  });
  it('treats UTC midnight as a calendar date, not 5pm Pacific', () => {
    const d = apiIsoToDisplayDate('2026-09-22T00:00:00.000Z');
    expect(isUtcDateOnlyIso('2026-09-22T00:00:00.000Z')).toBe(true);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(22);
  });

  it('maps 6pm PDT instants to 6pm wall clock', () => {
    const d = apiIsoToDisplayDate('2026-09-16T01:00:00.000Z');
    expect(d.getHours()).toBe(18);
    expect(d.getMinutes()).toBe(0);
    expect(formatIsoTime12hr('2026-09-16T01:00:00.000Z')).toBe('6:00pm');
  });

  it('formats event subtitles as 6-8pm not 5-7pm', () => {
    const subtitle = formatEventSubtitle(
      '2026-09-16T01:00:00.000Z',
      '2026-09-16T03:00:00.000Z'
    );
    expect(subtitle).toContain('6:00');
    expect(subtitle).toContain('8:00 PM');
    expect(subtitle).not.toContain('5:00');
  });
});
