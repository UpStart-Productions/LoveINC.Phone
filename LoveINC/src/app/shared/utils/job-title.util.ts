/** Employer titles often stuff company, pay, and keywords after " - ". */

const SEPARATOR = /\s+[-–—|]\s+/;
const PAY_SNIPPET =
  /\$[\d,.]+k?(?:\s*(?:[-–—]|to)\s*\$?[\d,.]+k?)?(?:\s*(?:per\s+)?(?:hour|hr|hrs|week|wk|month|mo|year|yr|annually))?/gi;
const PAY_K_PER =
  /\b\d+(?:\.\d+)?k\s+per\s+(?:hour|week|month|year)\b/gi;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function companyVariants(companyName: string): string[] {
  const trimmed = companyName.trim();
  if (!trimmed) return [];
  const noSuffix = trimmed.replace(/,?\s*\b(?:inc|llc|corp|corporation|company|co|ltd)\.?\s*$/i, '').trim();
  const noThe = noSuffix.replace(/^the\s+/i, '').trim();
  return [...new Set([trimmed, noSuffix, noThe].filter((s) => s.length >= 3))];
}

function stripCompany(title: string, companyName: string): string {
  let next = title;
  for (const variant of companyVariants(companyName)) {
    next = next.replace(new RegExp(escapeRegExp(variant), 'gi'), ' ');
  }
  return next;
}

function stripPay(title: string): string {
  return title.replace(PAY_SNIPPET, ' ').replace(PAY_K_PER, ' ');
}

function collapseJunk(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/(?:\s+[-–—|]\s*){2,}/g, ' - ')
    .replace(/^\s*[-–—|]\s*/g, '')
    .replace(/\s*[-–—|]\s*$/g, '')
    .trim();
}

function keepRole(title: string): string {
  const parts = title.split(SEPARATOR).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 2) return parts.join(' - ');
  if (parts[0].length <= 5) return `${parts[0]} - ${parts[1]}`;
  return parts[0];
}

/** Short display title. Falls back to the original if cleanup would empty it. */
export function trimJobTitle(title: string, companyName?: string): string {
  const raw = title.trim();
  if (!raw) return raw;
  let next = stripPay(raw);
  next = stripCompany(next, companyName ?? '');
  next = collapseJunk(next);
  next = keepRole(next);
  next = collapseJunk(next);
  return next || raw;
}
