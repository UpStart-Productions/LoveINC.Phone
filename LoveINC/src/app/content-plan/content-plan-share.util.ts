import { resolveMomentBlockText } from './content-plan.mapper';
import type { ContentPlan, ContentPlanBlock, ContentPlanMoment } from './content-plan.model';

function contentString(block: ContentPlanBlock, key: string): string {
  const value = block.content[key];
  return typeof value === 'string' ? value.trim() : '';
}

function blockOptions(block: ContentPlanBlock): string[] {
  const raw = block.content['options'];
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === 'string' && !!value.trim());
}

function appendMomentBlocksShareHtml(blocks: ContentPlanBlock[]): string {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  let html = '';

  for (const block of sorted) {
    switch (block.type) {
      case 'RICH_TEXT': {
        const richHtml = contentString(block, 'html');
        if (richHtml) {
          html += richHtml;
        }
        break;
      }
      case 'TEXT_INPUT': {
        const label = contentString(block, 'label') || 'Response';
        const placeholder = contentString(block, 'text');
        html += `<p><strong>${label}</strong></p>`;
        if (placeholder) {
          html += `<p>${placeholder}</p>`;
        }
        break;
      }
      case 'CHECKBOX':
      case 'RADIO': {
        const label = contentString(block, 'label') || 'Choose one';
        const options = blockOptions(block);
        if (options.length === 0) break;
        html += `<p><strong>${label}</strong></p><ul>`;
        for (const option of options) {
          html += `<li>${option}</li>`;
        }
        html += '</ul>';
        break;
      }
      case 'VIDEO': {
        const caption = contentString(block, 'caption');
        const url = contentString(block, 'url');
        if (caption) {
          html += `<p>${caption}</p>`;
        }
        if (url) {
          html += `<p><a href="${url}">${url}</a></p>`;
        }
        break;
      }
      case 'PHOTO': {
        const caption = contentString(block, 'caption');
        const url = contentString(block, 'url');
        if (caption) {
          html += `<p>${caption}</p>`;
        }
        if (url) {
          html += `<p><a href="${url}">${caption || 'View photo'}</a></p>`;
        }
        break;
      }
      case 'DOCUMENT': {
        const caption = contentString(block, 'caption');
        const url = contentString(block, 'url');
        const filename = contentString(block, 'filename');
        if (caption) {
          html += `<p>${caption}</p>`;
        }
        if (url) {
          html += `<p><a href="${url}">${filename || 'View document'}</a></p>`;
        }
        break;
      }
    }
  }

  return html;
}

function appendPlanAuthorHtml(plan: ContentPlan): string {
  const author = plan.author?.name?.trim();
  return author ? `<p><strong>By</strong> ${author}</p>` : '';
}

/** Share body for a single moment, optionally under a parent plan title. */
export function buildContentPlanMomentShareHtml(
  moment: ContentPlanMoment,
  plan?: ContentPlan | null
): string {
  let html = '';

  if (plan?.title?.trim()) {
    html += `<h2>${plan.title}</h2>`;
    html += appendPlanAuthorHtml(plan);
  }

  html += `<h3>${moment.title}</h3>`;
  html += appendMomentBlocksShareHtml(moment.blocks);
  return html;
}

/** Share body for what the user is viewing on the plan page. */
export function buildContentPlanPageShareHtml(plan: ContentPlan, pageIndex = 0): string {
  let html = `<h2>${plan.title}</h2>`;
  html += appendPlanAuthorHtml(plan);

  switch (plan.displayStyle) {
    case 'MULTI_PAGE': {
      const moment = plan.moments[pageIndex];
      if (!moment) break;
      if (pageIndex > 0 || plan.moments.length > 1) {
        html += `<h3>${moment.title}</h3>`;
      }
      html += appendMomentBlocksShareHtml(moment.blocks);
      break;
    }
    case 'LIST': {
      html += '<ul>';
      for (const moment of plan.moments) {
        const subtitle = resolveMomentBlockText(moment, 'subtitle');
        html += `<li><strong>${moment.title}</strong>`;
        if (subtitle) {
          html += `: ${subtitle}`;
        }
        html += '</li>';
      }
      html += '</ul>';
      break;
    }
    default: {
      for (const moment of plan.moments) {
        if (plan.moments.length > 1) {
          html += `<h3>${moment.title}</h3>`;
        }
        html += appendMomentBlocksShareHtml(moment.blocks);
      }
    }
  }

  return html;
}

export function buildContentPlanPageShareSubject(plan: ContentPlan, pageIndex = 0): string {
  if (plan.displayStyle === 'MULTI_PAGE') {
    const moment = plan.moments[pageIndex];
    if (moment && (pageIndex > 0 || plan.moments.length > 1)) {
      return `Love INC Content Plan: ${plan.title} — ${moment.title}`;
    }
  }
  return `Love INC Content Plan: ${plan.title}`;
}

export function buildContentPlanMomentShareSubject(
  moment: ContentPlanMoment,
  plan?: ContentPlan | null
): string {
  if (plan?.title?.trim()) {
    return `Love INC Content Plan: ${plan.title} — ${moment.title}`;
  }
  return `Love INC Content Plan: ${moment.title}`;
}
