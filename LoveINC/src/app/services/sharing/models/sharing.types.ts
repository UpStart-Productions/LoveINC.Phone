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
}
