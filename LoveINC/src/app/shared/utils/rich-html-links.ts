import { Browser } from '@capacitor/browser';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[-.\s]*)?(?:\(?\d{3}\)?[-.\s]*)\d{3}[-.\s]*\d{4}\b/g;

function emailFromHref(href: string): string | null {
  const raw = href.trim();
  if (!raw) return null;
  if (/^mailto:/i.test(raw)) return null;
  const stripped = raw.replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
  const match = stripped.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match?.[0] ?? null;
}

function phoneDigits(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return null;
}

function phoneFromHref(href: string): string | null {
  const raw = href.trim();
  if (!raw || /^(mailto|tel|https?):/i.test(raw)) return null;
  return phoneDigits(raw);
}

function wrapPhone(match: string): string {
  const digits = phoneDigits(match);
  return digits ? `<a href="tel:${digits}">${match}</a>` : match;
}

function linkifyTextContacts(text: string): string {
  const withEmails = text.replace(EMAIL_RE, (email) => `<a href="mailto:${email}">${email}</a>`);
  return withEmails
    .split(/(<a\b[^>]*>[\s\S]*?<\/a>)/gi)
    .map((part, index) => (index % 2 === 1 ? part : part.replace(PHONE_RE, wrapPhone)))
    .join('');
}

/** Fix Quill email/phone hrefs and wrap bare addresses and US numbers in links. */
export function linkifyRichHtmlEmails(html: string): string {
  if (!html) return html;

  const withFixedHrefs = html.replace(/<a\b([^>]*)>/gi, (full, attrs: string) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])([\s\S]*?)\1/i);
    if (!hrefMatch) return full;
    const email = emailFromHref(hrefMatch[2]);
    if (email) {
      return `<a${attrs.replace(hrefMatch[0], `href="mailto:${email}"`)}>`;
    }
    const phone = phoneFromHref(hrefMatch[2]);
    if (phone) {
      return `<a${attrs.replace(hrefMatch[0], `href="tel:${phone}"`)}>`;
    }
    return full;
  });

  return withFixedHrefs
    .split(/(<a\b[^>]*>[\s\S]*?<\/a>)/gi)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part.replace(/>([^<]+)</g, (_full, text: string) => `>${linkifyTextContacts(text)}<`);
    })
    .join('');
}

/** Open mailto/tel in the system app; http(s) in the in-app browser. */
export function handleRichHtmlClick(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest('a');
  if (!anchor) return;

  const href = anchor.getAttribute('href')?.trim() ?? '';
  if (!href) return;

  if (/^(mailto|tel):/i.test(href)) {
    event.preventDefault();
    event.stopPropagation();
    window.location.href = href;
    return;
  }

  if (/^https?:\/\//i.test(href)) {
    event.preventDefault();
    event.stopPropagation();
    void Browser.open({ url: href });
  }
}
