import type { ContentPlanBlock } from './content-plan.model';

export function buildContentPlanInputKey(
  planMomentId: string,
  block: ContentPlanBlock
): string {
  const blockKey = block.blockId?.trim() || block.id?.trim() || String(block.order);
  return `${planMomentId}:${blockKey}`;
}

export function escapeJournalHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatJournalTextAppend(
  previous: string | undefined,
  next: string
): string {
  const prior = previous ?? '';
  const value = next.trim();
  if (!value || value === prior) {
    return '';
  }
  if (prior && value.startsWith(prior)) {
    const suffix = value.slice(prior.length);
    if (!suffix.trim()) {
      return '';
    }
    return `<p>${escapeJournalHtml(suffix)}</p>`;
  }
  return `<p>${escapeJournalHtml(value)}</p>`;
}

export function formatJournalRadioAppend(
  previous: string | undefined,
  next: string
): string {
  const value = next.trim();
  if (!value || value === (previous ?? '')) {
    return '';
  }
  return `<p>${escapeJournalHtml(value)}</p>`;
}

export function formatJournalCheckboxAppend(
  previous: string[] | undefined,
  next: string[]
): string {
  const prior = previous ?? [];
  const added = next.filter((option) => !prior.includes(option));
  if (!added.length) {
    return '';
  }
  return added.map((option) => `<p>${escapeJournalHtml(option)}</p>`).join('');
}
