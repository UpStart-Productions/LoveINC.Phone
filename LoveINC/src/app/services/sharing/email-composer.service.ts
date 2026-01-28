import { Injectable } from '@angular/core';
import { EmailComposer } from 'capacitor-email-composer';
import { AppLauncher } from '@capacitor/app-launcher';

export interface EmailDraft {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  attachments?: { type: 'absolute' | 'resource' | 'asset' | 'base64'; path: string; name?: string }[];
}

@Injectable({ providedIn: 'root' })
export class EmailComposerService {
  async canSend(): Promise<boolean> {
    try {
      const result = await EmailComposer.hasAccount();
      const { hasAccount } = result;
      return hasAccount;
    } catch (error) {
      console.error('Error checking hasAccount:', error);
      return false;
    }
  }

  async open(draft: EmailDraft) {
    try {
      await EmailComposer.open({
        to: draft.to,
        cc: draft.cc,
        bcc: draft.bcc,
        subject: draft.subject ?? '',
        body: draft.htmlBody || draft.textBody || '',
        isHtml: !!draft.htmlBody,
        attachments: draft.attachments
      });
    } catch (error) {
      console.error('Error opening email composer:', error);
      throw error;
    }
  }

  /**
   * Try to open Gmail or Outlook as fallbacks
   */
  async tryAlternativeMailApps(draft: EmailDraft): Promise<boolean> {
    // Convert HTML to plain text for deep links
    const plainTextBody = this.htmlToPlainText(draft.htmlBody || draft.textBody || '');
    const to = encodeURIComponent(draft.to?.[0] || '');
    const subject = encodeURIComponent(draft.subject || '');
    const body = encodeURIComponent(plainTextBody);

    try {
      // Try Gmail first
      const { value: hasGmail } = await AppLauncher.canOpenUrl({ url: 'googlegmail://' });
      if (hasGmail) {
        const gmailUrl = `googlegmail:///co?to=${to}&subject=${subject}&body=${body}`;
        await AppLauncher.openUrl({ url: gmailUrl });
        return true;
      }

      // Try Outlook
      const { value: hasOutlook } = await AppLauncher.canOpenUrl({ url: 'ms-outlook://' });
      if (hasOutlook) {
        const outlookUrl = `ms-outlook://compose?to=${to}&subject=${subject}&body=${body}`;
        await AppLauncher.openUrl({ url: outlookUrl });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error trying alternative mail apps:', error);
      return false;
    }
  }

  /**
   * Convert HTML to plain text for deep link fallbacks
   */
  private htmlToPlainText(html: string): string {
    if (!html) return '';
    
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '') // Remove all other HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}
