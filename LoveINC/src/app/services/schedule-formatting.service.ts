import { Injectable } from '@angular/core';
import { joinWithAppDot } from '../shared/utils';
import type { PlatformScheduleRule } from './platform/types';

@Injectable({ providedIn: 'root' })
export class ScheduleFormattingService {
  /** Normalize API schedule rule (snake_case or camelCase) to PlatformScheduleRule */
  normalizeScheduleRule(rule: unknown): PlatformScheduleRule | undefined {
    if (!rule || typeof rule !== 'object') return undefined;
    const r = rule as Record<string, unknown>;
    const days = (r['daysOfWeek'] ?? r['days_of_week']) as number[] | undefined;
    const start = (r['startTime'] ?? r['start_time']) as string | undefined;
    const end = (r['endTime'] ?? r['end_time']) as string | undefined;
    if (!days?.length && !start && !end) return undefined;
    return {
      ruleType: (r['ruleType'] ?? r['rule_type'] ?? 'recurring') as string,
      daysOfWeek: days,
      startTime: start,
      endTime: end,
    };
  }

  formatScheduleRule(rule: PlatformScheduleRule | undefined): string | null {
    if (!rule) return null;
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (rule.ruleType === 'by_appointment') return 'By appointment';
    if (rule.daysOfWeek?.length) {
      const names = rule.daysOfWeek.map((d) => DAY_NAMES[d] ?? '').filter(Boolean);
      const days = names.length ? names.join(', ') : '';
      const start12 = rule.startTime ? this.formatTime24To12(rule.startTime) : '';
      const end12 = rule.endTime ? this.formatTime24To12(rule.endTime) : '';
      const time = joinWithAppDot(start12, end12) || '';
      return [days, time].filter(Boolean).join(' ') || null;
    }
    return null;
  }

  private formatTime24To12(time24: string): string {
    const match = time24.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return time24;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const period = h >= 12 ? 'pm' : 'am';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h}:${m}${period}`;
  }

  /** Get schedule string for a volunteer position (schedule, scheduleRule, or schedule_rule) */
  getPositionSchedule(pos: {
    schedule?: string;
    schedule_rule?: unknown;
    scheduleRule?: unknown;
    [key: string]: unknown;
  }): string | undefined {
    const schedStr = (pos.schedule ?? (pos as Record<string, unknown>)['schedule']) as string | undefined;
    if (schedStr?.trim()) return schedStr;
    const rule = pos.scheduleRule ?? pos.schedule_rule ?? (pos as Record<string, unknown>)['schedule_rule'] ?? (pos as Record<string, unknown>)['scheduleRule'];
    const formatted = this.formatScheduleRule(this.normalizeScheduleRule(rule));
    return formatted ?? undefined;
  }
}
