import { Injectable, ElementRef } from '@angular/core';
import { ActionSheetController } from '@ionic/angular/standalone';
import { Share } from '@capacitor/share';
import { EmailComposerService } from './email-composer.service';
import { SharingOptions, ShareContent } from './models/sharing.types';

/**
 * Generic sharing service that provides action sheet with multiple sharing options.
 */
@Injectable({
  providedIn: 'root'
})
export class SharingService {

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private emailComposerService: EmailComposerService
  ) {}

  /**
   * Main sharing method that shows action sheet with sharing options
   */
  async shareContent(options: SharingOptions): Promise<void> {
    try {
      // Prepare content
      const shareContent = await this.prepareShareContent(options);
      
      // Show action sheet with sharing options
      const actionSheet = await this.actionSheetCtrl.create({
        header: 'Share Content',
        cssClass: 'share-action-sheet',
        buttons: [
          {
            text: 'Email as Text',
            icon: 'mail-outline',
            handler: () => this.shareAsEmailText(shareContent)
          },
          {
            text: 'Text/SMS',
            icon: 'chatbubble-outline',
            handler: () => this.shareAsText(shareContent)
          },
          {
            text: 'Cancel',
            icon: 'close-outline',
            role: 'cancel'
          }
        ]
      });

      await actionSheet.present();
    } catch (error) {
      console.error('Error sharing content:', error);
      throw error;
    }
  }

  /**
   * Prepare content for sharing by capturing HTML and converting to text
   */
  private async prepareShareContent(options: SharingOptions): Promise<ShareContent> {
    let htmlContent = options.htmlContent || '';

    // If content element is provided, capture its HTML
    if (options.contentElement?.nativeElement) {
      htmlContent = options.contentElement.nativeElement.innerHTML;
    }

    // Convert HTML to plain text while preserving line breaks
    const textContent = this.htmlToText(htmlContent);

    // Use provided subject or default to title
    const subject = options.subject || options.title;

    return {
      title: options.title,
      subject,
      htmlContent,
      textContent,
      recipientEmail: options.recipientEmail
    };
  }

  /**
   * Convert HTML to plain text - STRIP ALL HTML TAGS while preserving structure
   */
  private htmlToText(html: string): string {
    let text = html;
    
    // Convert headers to ALL CAPS and add line breaks
    text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, (match, content) => {
      return '\r\n' + content.toUpperCase() + '\r\n';
    });
    
    // Convert <p> tags to line breaks
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '\r\n$1\r\n');
    
    // Convert <div> tags to line breaks
    text = text.replace(/<div[^>]*>(.*?)<\/div>/gi, '\r\n$1\r\n');
    
    // Convert <br> tags to line breaks
    text = text.replace(/<br[^>]*>/gi, '\r\n');
    
    // Convert list items to bullets
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '\r\n• $1');
    
    // Convert <ul> and <ol> tags to line breaks
    text = text.replace(/<(ul|ol)[^>]*>(.*?)<\/(ul|ol)>/gi, '\r\n$2\r\n');
    
    // Strip ALL remaining HTML tags completely
    text = text.replace(/<[^>]*>/g, '');
    
    // Clean up whitespace and normalize line breaks
    text = text
      .replace(/\r\n\s*\r\n\s*\r\n/g, '\r\n\r\n') // Replace multiple newlines with double newlines
      .replace(/\r\n\s*\r\n/g, '\r\n\r\n') // Ensure proper paragraph breaks
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .trim();
    
    // Decode common HTML entities
    text = this.decodeHtmlEntities(text);
    
    return text;
  }

  /**
   * Decode common HTML entities to their corresponding characters
   */
  private decodeHtmlEntities(text: string): string {
    const htmlEntities: { [key: string]: string } = {
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&hellip;': '...',
      '&mdash;': '—',
      '&ndash;': '–',
      '&lsquo;': '\'',
      '&rsquo;': '\'',
      '&ldquo;': '"',
      '&rdquo;': '"',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };

    // Replace HTML entities with their corresponding characters
    let decodedText = text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      return htmlEntities[entity] || entity;
    });

    // Use browser's built-in HTML entity decoding as a fallback for any remaining entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = decodedText;
    return tempDiv.textContent || tempDiv.innerText || decodedText;
  }

  /**
   * Share as email with formatted HTML content
   */
  private async shareAsEmailText(content: ShareContent): Promise<void> {
    try {
      // Create HTML email body with preserved formatting
      const htmlBody = this.createHtmlEmailBody(content);

      // Check if email is available
      const canSend = await this.emailComposerService.canSend();

      // Try to open email composer
      if (!canSend) {
        // Try to open anyway (sometimes canSend returns false but still works)
        try {
          await this.emailComposerService.open({
            to: content.recipientEmail ? [content.recipientEmail] : undefined,
            subject: content.subject,
            htmlBody: htmlBody
          });
          return;
        } catch (nativeError) {
          // Try Gmail/Outlook as fallbacks
          const alternativeSuccess = await this.emailComposerService.tryAlternativeMailApps({
            to: content.recipientEmail ? [content.recipientEmail] : undefined,
            subject: content.subject,
            htmlBody: htmlBody
          });
          
          if (alternativeSuccess) {
            return;
          }
          
          // Final fallback to generic share
          await this.fallbackToGenericShare(content);
          return;
        }
      }

      // Email is available, open composer
      await this.emailComposerService.open({
        to: content.recipientEmail ? [content.recipientEmail] : undefined,
        subject: content.subject,
        htmlBody: htmlBody
      });

    } catch (error) {
      console.error('Error sharing as email:', error);
      // Fallback to generic share
      await this.fallbackToGenericShare(content);
    }
  }

  /**
   * Create HTML email body with preserved formatting
   */
  private createHtmlEmailBody(content: ShareContent): string {
    let html = '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">';
    
    // Add recipient info if available
    if (content.recipientEmail) {
      html += `<p style="color: #6c757d; font-size: 14px;"><strong>To:</strong> ${content.recipientEmail}</p>`;
      html += '<hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;"><br>';
    }

    // Add main content
    let processedContent = content.htmlContent || '';
    if (processedContent) {
      // Convert line breaks to <br> tags
      processedContent = processedContent.replace(/\r\n/g, '\n').replace(/\n/g, '<br>');
    }
    html += processedContent;

    html += '</div>';

    return html;
  }

  /**
   * Share as plain text (strips HTML but preserves line breaks)
   * Uses the device's native share dialog
   */
  private async shareAsText(content: ShareContent): Promise<void> {
    try {
      const shareOptions = {
        title: content.title,
        text: content.textContent,
        dialogTitle: 'Share as Text'
      };
      
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing as text:', error);
      throw error;
    }
  }

  /**
   * Fallback to generic share if email composer fails
   */
  private async fallbackToGenericShare(content: ShareContent): Promise<void> {
    const shareOptions = {
      title: content.subject,
      text: content.textContent,
      dialogTitle: 'Share via Email'
    };
    
    await Share.share(shareOptions);
  }
}
