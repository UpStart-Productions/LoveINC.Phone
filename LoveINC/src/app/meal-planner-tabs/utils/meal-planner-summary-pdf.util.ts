import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { WeeklyBarData } from '../../goal-tracker-tabs/components/weekly-bar-chart/weekly-bar-chart.component';

export interface SummaryPdfCookedMeal {
  title: string;
  detail?: string;
}

const CHART_HEIGHT = 64;
const BAR_WIDTH = 16;
const BAR_COLUMN_WIDTH = 32;

export function formatMealsCooked(completed: number, scheduled: number): string {
  return `${completed}/${scheduled} meals cooked`;
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

function buildCookedMealsSection(meals: SummaryPdfCookedMeal[]): Content {
  if (!meals.length) {
    return { text: 'No meals cooked for this period.', color: '#666', fontSize: 9 };
  }

  return {
    stack: meals.map((meal) => ({
      margin: [0, 0, 0, 8] as [number, number, number, number],
      stack: [
        { text: meal.title, bold: true, fontSize: 10 },
        ...(meal.detail
          ? [{ text: meal.detail, fontSize: 8, color: '#666' }]
          : []),
      ],
    })),
  };
}

function buildTotalsRow(mealsCookedLabel: string, totalPercent: number): Content {
  return {
    columns: [
      { width: '*', text: mealsCookedLabel, bold: true, fontSize: 13 },
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
  periodLabel: string,
  mealsCookedLabel: string,
  totalPercent: number,
  weeklyData: WeeklyBarData[]
): { stack: Content[] } {
  return {
    stack: [
      buildTotalsRow(mealsCookedLabel, totalPercent),
      buildBarChart(weeklyData),
      {
        text: periodLabel,
        alignment: 'center',
        fontSize: 9,
        color: '#444',
        margin: [0, 6, 0, 0] as [number, number, number, number],
      },
    ],
  };
}

function buildMealsSection(
  cookedMeals: SummaryPdfCookedMeal[],
  recapNarrative?: string
): { stack: Content[] } {
  const stack: Content[] = [
    {
      text: 'Meals cooked',
      bold: true,
      fontSize: 12,
      margin: [0, 0, 0, 8] as [number, number, number, number],
    },
  ];

  if (recapNarrative?.trim()) {
    stack.push({
      text: recapNarrative.trim(),
      fontSize: 9,
      color: '#444',
      margin: [0, 0, 0, 10] as [number, number, number, number],
    });
  }

  stack.push(buildCookedMealsSection(cookedMeals));
  return { stack };
}

export function buildMealPlannerSummaryDocDefinition(options: {
  periodLabel: string;
  totalPercent: number;
  totalCompleted: number;
  totalScheduled: number;
  weeklyData: WeeklyBarData[];
  cookedMeals: SummaryPdfCookedMeal[];
  recapNarrative?: string;
  stackChartAboveContent?: boolean;
  userFullName?: string;
}): TDocumentDefinitions {
  const mealsCookedLabel = formatMealsCooked(options.totalCompleted, options.totalScheduled);
  const headerContent: Content[] = [
    {
      text: options.periodLabel,
      style: 'header',
      margin: [0, 0, 0, options.userFullName ? 4 : 16] as [number, number, number, number],
    },
  ];
  if (options.userFullName?.trim()) {
    headerContent.push({
      text: options.userFullName.trim(),
      style: 'subtitle',
      margin: [0, 0, 0, 16] as [number, number, number, number],
    });
  }

  const chartStack = buildChartStack(
    options.periodLabel,
    mealsCookedLabel,
    options.totalPercent,
    options.weeklyData
  );
  const mealsSection = buildMealsSection(options.cookedMeals, options.recapNarrative);

  const bodyContent: Content = options.stackChartAboveContent
    ? {
        stack: [
          chartStack,
          { text: '', margin: [0, 0, 0, 14] as [number, number, number, number] },
          mealsSection,
        ],
      }
    : {
        columns: [
          { width: '46%', stack: chartStack.stack },
          { width: '*', stack: mealsSection.stack },
        ],
        columnGap: 14,
      };

  return {
    info: {
      title: options.periodLabel,
      subject: 'Meal Planner Summary',
    },
    content: [...headerContent, bodyContent],
  };
}

export function buildMealPlannerSummaryPdfFilename(periodLabel: string): string {
  return periodLabel.replace(/\s*–\s*/g, '-').replace(/\s+/g, '-').replace(/^Week-/, 'Meal-Planner-Week-');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMealPlannerSummaryShareHtml(options: {
  periodLabel: string;
  totalPercent: number;
  totalCompleted: number;
  totalScheduled: number;
  weeklyData: WeeklyBarData[];
  cookedMeals: SummaryPdfCookedMeal[];
  recapNarrative?: string;
  userFullName?: string;
}): string {
  const mealsCookedLabel = formatMealsCooked(options.totalCompleted, options.totalScheduled);
  let html = `<h2>${escapeHtml(options.periodLabel)}</h2>`;

  if (options.userFullName?.trim()) {
    html += `<p>${escapeHtml(options.userFullName.trim())}</p>`;
  }

  html += `<p><strong>${escapeHtml(mealsCookedLabel)}</strong> — ${options.totalPercent}%</p>`;

  if (options.weeklyData.length) {
    html += '<h3>Progress</h3><ul>';
    for (const item of options.weeklyData) {
      html += `<li>${escapeHtml(item.label)}: ${item.value}%</li>`;
    }
    html += '</ul>';
  }

  html += '<h3>Meals cooked</h3>';
  if (options.recapNarrative?.trim()) {
    html += `<p>${escapeHtml(options.recapNarrative.trim())}</p>`;
  }
  if (!options.cookedMeals.length) {
    html += '<p>No meals cooked for this period.</p>';
    return html;
  }

  for (const meal of options.cookedMeals) {
    html += `<p><strong>${escapeHtml(meal.title)}</strong>`;
    if (meal.detail) {
      html += `<br>${escapeHtml(meal.detail)}`;
    }
    html += '</p>';
  }

  return html;
}
