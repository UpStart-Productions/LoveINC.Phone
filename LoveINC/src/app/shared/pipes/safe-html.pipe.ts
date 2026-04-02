import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { markQuillParagraphGaps } from '../utils/quill-rich-html';

/**
 * Bypasses Angular's HTML sanitizer so custom elements (e.g. ion-icon) render in innerHTML.
 * Marks Quill double-Enter spacer blocks for .rich-html paragraph spacing.
 * Only use with trusted content from app code, not raw user input.
 */
@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(html: string | undefined): SafeHtml {
    const raw = html ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(markQuillParagraphGaps(raw));
  }
}
