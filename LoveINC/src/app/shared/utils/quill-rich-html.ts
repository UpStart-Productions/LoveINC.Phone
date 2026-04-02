/**
 * Quill encodes a paragraph break (double Enter) as an "empty" block, typically
 * <p><br></p> or <p><br class="..."></p>. Our regex used to only match plain <br>,
 * so attributed <br> tags were missed and spacers never got styled.
 *
 * Any <p> whose content is only whitespace, &nbsp;, and/or <br> tags is treated
 * as a paragraph gap and replaced with a div that cannot collapse like <p><br>.
 */
const SPACER_PARAGRAPH_INNER =
  /^(?:(?:\s|&nbsp;|&#160;|&#x0*a0;|\u00A0)+|<br\b[^>]*>)+$/i;

function isQuillSpacerParagraphInner(inner: string): boolean {
  const t = inner.trim();
  if (t === '') {
    return true;
  }
  return SPACER_PARAGRAPH_INNER.test(t);
}

export function markQuillParagraphGaps(html: string): string {
  if (!html) {
    return html;
  }
  return html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (full, _attrs: string, inner: string) => {
    if (isQuillSpacerParagraphInner(inner)) {
      return '<div class="rich-html-para-gap" role="presentation"></div>';
    }
    return full;
  });
}
