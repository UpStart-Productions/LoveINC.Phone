import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { MEAL_RECIPE_ATTRIBUTION } from '../config/meal-recipe-provider.config';
import type { IngredientLineDisplay } from '@upstart-productions/meal-planner';

export interface RecipePdfInput {
  title: string;
  readyInMinutes?: number;
  servings: number;
  ingredients: IngredientLineDisplay[];
  instructions: string[];
}

export function formatIngredientLineForPdf(item: IngredientLineDisplay): string {
  const quantityParts: string[] = [];
  if (item.whole) {
    quantityParts.push(item.whole);
  }
  if (item.fraction) {
    quantityParts.push(item.fraction);
  }
  if (!quantityParts.length) {
    return item.remainder;
  }

  const remainder = item.remainder.trimStart();
  return remainder ? `${quantityParts.join(' ')} ${remainder}` : quantityParts.join(' ');
}

function buildMetaLine(input: RecipePdfInput): string {
  const parts: string[] = [];
  if (input.readyInMinutes) {
    parts.push(`${input.readyInMinutes} min`);
  }
  parts.push(`Serves ${input.servings}`);
  return parts.join(' · ');
}

export function buildRecipePdfDocDefinition(input: RecipePdfInput): TDocumentDefinitions {
  const ingredientLines = input.ingredients.map((item) => formatIngredientLineForPdf(item));
  const content: Content[] = [
    {
      text: input.title,
      style: 'header',
      margin: [0, 0, 0, 4] as [number, number, number, number],
    },
    {
      text: buildMetaLine(input),
      style: 'subtitle',
      margin: [0, 0, 0, 16] as [number, number, number, number],
    },
    {
      text: 'Ingredients',
      bold: true,
      fontSize: 12,
      margin: [0, 0, 0, 8] as [number, number, number, number],
    },
    {
      ul: ingredientLines.length ? ingredientLines : ['None listed'],
      margin: [0, 0, 0, 16] as [number, number, number, number],
    },
    {
      text: 'Steps',
      bold: true,
      fontSize: 12,
      margin: [0, 0, 0, 8] as [number, number, number, number],
    },
    {
      ol: input.instructions.length ? input.instructions : ['See recipe source for instructions.'],
    },
    {
      text: MEAL_RECIPE_ATTRIBUTION,
      style: 'footnote',
      margin: [0, 16, 0, 0] as [number, number, number, number],
    },
  ];

  return {
    info: {
      title: input.title,
      subject: 'Meal Planner Recipe',
    },
    content,
  };
}

export function buildRecipePdfFilename(title: string): string {
  const safe = title
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe ? `Recipe-${safe}` : 'Recipe';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildRecipeShareHtml(input: RecipePdfInput): string {
  const ingredientLines = input.ingredients.map((item) => formatIngredientLineForPdf(item));
  let html = `<h2>${escapeHtml(input.title)}</h2>`;
  html += `<p>${escapeHtml(buildMetaLine(input))}</p>`;
  html += '<h3>Ingredients</h3><ul>';

  for (const line of ingredientLines.length ? ingredientLines : ['None listed']) {
    html += `<li>${escapeHtml(line)}</li>`;
  }

  html += '</ul><h3>Steps</h3><ol>';
  const steps = input.instructions.length ? input.instructions : ['See recipe source for instructions.'];
  for (const step of steps) {
    html += `<li>${escapeHtml(step)}</li>`;
  }
  html += '</ol>';

  return html;
}
