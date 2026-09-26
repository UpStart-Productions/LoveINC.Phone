import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { WeeklyBarData } from '../components/weekly-bar-chart/weekly-bar-chart.component';

export interface StatisticsPdfHabitStat {
  habit: { name: string; color?: string };
  goalName: string;
  completed: number;
  scheduled: number;
  percent: number;
  change: number | null;
}

const GOAL_TRACKER_COLOR_HEX: Record<string, string> = {
  'prussian-blue': '#003049',
  'blue-ribbon': '#0370f8',
  'picton-blue': '#52c0f6',
  emerald: '#32c058',
  'red-orange': '#fe4c40',
  magenta: '#fd13eb',
  'purple-heart': '#4f2cc2',
  amethyst: '#a44ad3',
  sunshade: '#fe8b25',
};

const CHART_HEIGHT = 64;
const BAR_WIDTH = 16;
const BAR_COLUMN_WIDTH = 32;

export function formatHabitsCompleted(completed: number, scheduled: number): string {
  return `${completed}/${scheduled} habits completed`;
}

function colorHex(colorKey: string | undefined): string {
  return GOAL_TRACKER_COLOR_HEX[colorKey ?? 'prussian-blue'] ?? GOAL_TRACKER_COLOR_HEX['prussian-blue'];
}

function formatChange(change: number | null): string {
  if (change === null) return '';
  if (change > 0) return `+${change}%`;
  return `${change}%`;
}

function buildBarChart(data: WeeklyBarData[]): Content {
  const cells = data.map((item) => {
    const barHeight = Math.max(1, (Math.max(0, Math.min(100, item.value)) / 100) * CHART_HEIGHT);

    return {
      stack: [
        {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: BAR_WIDTH,
              h: CHART_HEIGHT,
              color: '#eeeeee',
              r: 1,
            },
            {
              type: 'rect',
              x: 0,
              y: CHART_HEIGHT - barHeight,
              w: BAR_WIDTH,
              h: barHeight,
              color: '#32c058',
              r: 1,
            },
          ],
          alignment: 'center',
        },
        {
          text: item.label,
          alignment: 'center',
          fontSize: 8,
          margin: [0, 3, 0, 0] as [number, number, number, number],
        },
      ],
      alignment: 'center',
    };
  });

  return {
    table: {
      widths: data.map(() => BAR_COLUMN_WIDTH),
      body: [cells],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    alignment: 'center',
  };
}

function buildHabitRows(stats: StatisticsPdfHabitStat[]): Content[][] {
  return stats.map((stat) => {
    const border = colorHex(stat.habit.color);
    const leftStack: Content[] = [
      { text: stat.habit.name, bold: true, fontSize: 10 },
      { text: `${stat.completed}/${stat.scheduled} times`, fontSize: 8, color: '#666' },
    ];
    if (stat.goalName) {
      leftStack.splice(1, 0, { text: stat.goalName, fontSize: 8, color: '#666' });
    }

    const rightStack: Content[] = [{ text: `${stat.percent}%`, bold: true, fontSize: 10, alignment: 'right' }];
    if (stat.change !== null) {
      rightStack.push({
        text: `${formatChange(stat.change)} vs prior week`,
        fontSize: 8,
        color: '#666',
        alignment: 'right',
      });
    }

    return [
      {
        stack: leftStack,
        border: [true, true, false, true] as [boolean, boolean, boolean, boolean],
        borderColor: [border, border, border, border],
      },
      {
        stack: rightStack,
        border: [false, true, true, true] as [boolean, boolean, boolean, boolean],
        borderColor: [border, border, border, border],
      },
    ];
  });
}

function buildHabitsSection(stats: StatisticsPdfHabitStat[]): Content {
  if (!stats.length) {
    return { text: 'No habits for this week.', color: '#666', fontSize: 9 };
  }

  return {
    table: {
      widths: ['*', 'auto'],
      body: buildHabitRows(stats),
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },
  };
}

function buildTotalsRow(habitsCompletedLabel: string, totalPercent: number): Content {
  return {
    columns: [
      { width: '*', text: habitsCompletedLabel, bold: true, fontSize: 13 },
      {
        width: 'auto',
        text: `${totalPercent}%`,
        bold: true,
        fontSize: 14,
        alignment: 'right',
      },
    ],
    margin: [0, 0, 0, 10] as [number, number, number, number],
  };
}

function buildChartStack(
  weekLabel: string,
  habitsCompletedLabel: string,
  totalPercent: number,
  weeklyData: WeeklyBarData[]
): { stack: Content[] } {
  return {
    stack: [
      buildTotalsRow(habitsCompletedLabel, totalPercent),
      buildBarChart(weeklyData),
      {
        text: weekLabel,
        alignment: 'center',
        fontSize: 9,
        color: '#444',
        margin: [0, 6, 0, 0] as [number, number, number, number],
      },
    ],
  };
}

function buildHabitsContent(habitStats: StatisticsPdfHabitStat[]): { stack: Content[] } {
  return {
    stack: [
      { text: 'Habits', bold: true, fontSize: 12, margin: [0, 0, 0, 8] as [number, number, number, number] },
      buildHabitsSection(habitStats),
    ],
  };
}

export function buildGoalTrackerStatisticsDocDefinition(options: {
  weekLabel: string;
  totalPercent: number;
  totalCompleted: number;
  totalScheduled: number;
  weeklyData: WeeklyBarData[];
  habitStats: StatisticsPdfHabitStat[];
  stackChartAboveContent?: boolean;
  userFullName?: string;
}): TDocumentDefinitions {
  const habitsCompletedLabel = formatHabitsCompleted(options.totalCompleted, options.totalScheduled);
  const headerContent: Content[] = [
    { text: options.weekLabel, style: 'header', margin: [0, 0, 0, options.userFullName ? 4 : 16] as [number, number, number, number] },
  ];
  if (options.userFullName?.trim()) {
    headerContent.push({
      text: options.userFullName.trim(),
      style: 'subtitle',
      margin: [0, 0, 0, 16] as [number, number, number, number],
    });
  }

  const chartStack = buildChartStack(
    options.weekLabel,
    habitsCompletedLabel,
    options.totalPercent,
    options.weeklyData
  );
  const habitsContent = buildHabitsContent(options.habitStats);

  const bodyContent: Content = options.stackChartAboveContent
    ? {
        stack: [
          chartStack,
          { text: '', margin: [0, 0, 0, 14] as [number, number, number, number] },
          habitsContent,
        ],
      }
    : {
        columns: [
          { width: '46%', stack: chartStack.stack },
          { width: '*', stack: habitsContent.stack },
        ],
        columnGap: 14,
      };

  return {
    info: {
      title: options.weekLabel,
      subject: 'Goal Tracker Statistics',
    },
    content: [...headerContent, bodyContent],
  };
}

export function buildGoalTrackerStatisticsPdfFilename(weekLabel: string): string {
  return weekLabel.replace(/^Week\s+/i, 'Goal-Tracker-Week-').replace(/\s*-\s*/g, '-').replace(/\s+/g, '-');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildGoalTrackerStatisticsShareHtml(options: {
  weekLabel: string;
  totalPercent: number;
  totalCompleted: number;
  totalScheduled: number;
  weeklyData: WeeklyBarData[];
  habitStats: StatisticsPdfHabitStat[];
  userFullName?: string;
}): string {
  const habitsCompletedLabel = formatHabitsCompleted(options.totalCompleted, options.totalScheduled);
  let html = `<h2>${escapeHtml(options.weekLabel)}</h2>`;

  if (options.userFullName?.trim()) {
    html += `<p>${escapeHtml(options.userFullName.trim())}</p>`;
  }

  html += `<p><strong>${escapeHtml(habitsCompletedLabel)}</strong> — ${options.totalPercent}%</p>`;

  if (options.weeklyData.length) {
    html += '<h3>Weekly progress</h3><ul>';
    for (const item of options.weeklyData) {
      html += `<li>${escapeHtml(item.label)}: ${item.value}%</li>`;
    }
    html += '</ul>';
  }

  html += '<h3>Habits</h3>';
  if (!options.habitStats.length) {
    html += '<p>No habits for this period.</p>';
    return html;
  }

  for (const stat of options.habitStats) {
    html += `<p><strong>${escapeHtml(stat.habit.name)}</strong>`;
    if (stat.goalName) {
      html += `<br>${escapeHtml(stat.goalName)}`;
    }
    html += `<br>${stat.completed}/${stat.scheduled} times — ${stat.percent}%`;
    if (stat.change !== null) {
      html += ` (${formatChange(stat.change)} vs prior week)`;
    }
    html += '</p>';
  }

  return html;
}
