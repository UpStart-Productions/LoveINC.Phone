import { ElementRef } from '@angular/core';

/**
 * Options for sharing content
 */
export interface SharingOptions {
  /** Title for the share (required) */
  title: string;
  
  /** Email subject line (defaults to title if not provided) */
  subject?: string;
  
  /** ViewChild element reference to capture HTML content */
  contentElement?: ElementRef<HTMLElement>;
  
  /** Pre-formatted HTML content string */
  htmlContent?: string;
  
  /** Optional recipient email address */
  recipientEmail?: string;

  /** Optional URL to append (e.g. App Store / Play Store listing for “share the app”). */
  url?: string;

  /** Action sheet header (defaults to “Share Content”). */
  actionSheetHeader?: string;

  /** Optional PDF share — generated only when the user picks Share PDF. */
  pdfShare?: PdfShareOptions;
}

/**
 * Lazy PDF generation for the Share PDF action sheet option.
 */
export interface PdfShareOptions {
  generate: () => Promise<{ filePath: string; filename?: string }>;
  subject?: string;
  body?: string;
}

/**
 * Prepared share content ready for sharing
 */
export interface ShareContent {
  /** Title of the content */
  title: string;
  
  /** Email subject line */
  subject: string;
  
  /** HTML formatted content */
  htmlContent: string;
  
  /** Plain text version of content */
  textContent: string;
  
  /** Optional recipient email */
  recipientEmail?: string;

  /** Same as options.url — passed through to native share when set */
  url?: string;
}
