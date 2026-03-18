import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';
import type { TDocumentDefinitions, PageSize, Content } from 'pdfmake/interfaces';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';

const APP_NAME = 'Love INC';
const APP_WEBSITE = 'https://loveinc.org';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private currentPdfPath: string | null = null;
  private currentPdfFilename: string | null = null;
  private currentPdfPathForCleanup: string | null = null;
  private currentEmailSubject: string | null = null;
  private currentEmailBody: string | null = null;
  private pdfMake = pdfMake;
  private htmlToPdfmake = htmlToPdfmake;

  constructor() {
    const vfs =
      (pdfFonts as { pdfMake?: { vfs?: unknown } }).pdfMake?.vfs ??
      (pdfFonts as { default?: unknown }).default ??
      pdfFonts;
    (this.pdfMake as Record<string, unknown>) = { ...pdfMake, vfs };
  }

  async createPdfFromHtml(htmlContent: string, title?: string): Promise<ReturnType<typeof pdfMake.createPdf>> {
    const modifiedHtml = htmlContent
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '<b style="font-size: 12px; display: block; margin: 4px 0;">$1</b>')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '<b style="font-size: 12px; display: block; margin: 6px 0;">$1</b>')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<b style="font-size: 12px; display: block; margin: 5px 0;">$1</b>')
      .replace(/<ion-chip[^>]*>(.*?)<\/ion-chip>/gi, '<span style="display: inline-block; background: #f0f0f0; padding: 2px 6px; margin: 1px; border-radius: 3px; font-size: 10px;">$1</span>');

    const pdfContent = this.htmlToPdfmake(modifiedHtml);
    const contentArray = (Array.isArray(pdfContent) ? pdfContent : [pdfContent]) as Content[];

    const docDefinition: TDocumentDefinitions = {
      content: [
        ...(title ? [{ text: title, style: 'header', margin: [0, 0, 0, 20] as [number, number, number, number] }] : []),
        ...contentArray,
      ] as Content[],
      footer: this.buildFooter() as TDocumentDefinitions['footer'],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
        },
        h1: { fontSize: 12, bold: true, margin: [0, 8, 0, 8] as [number, number, number, number] },
        h2: { fontSize: 11, bold: true, margin: [0, 6, 0, 6] as [number, number, number, number] },
        h3: { fontSize: 9, bold: true, margin: [0, 4, 0, 4] as [number, number, number, number] },
        h4: { fontSize: 9, bold: true, margin: [0, 3, 0, 3] as [number, number, number, number] },
        h5: { fontSize: 8, bold: true, margin: [0, 2, 0, 2] as [number, number, number, number] },
        h6: { fontSize: 8, bold: true, margin: [0, 2, 0, 2] as [number, number, number, number] },
        footnote: { color: '#777', fontSize: 9, lineHeight: 1.0 },
      },
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.3,
      },
      info: {
        title: title ?? 'Generated Document',
        author: APP_NAME,
        subject: 'Generated PDF Document',
        creator: `${APP_NAME} App`,
        producer: 'pdfmake',
      },
      pageSize: 'A4' as PageSize,
      pageMargins: [40, 60, 40, 60] as [number, number, number, number],
    };

    return this.pdfMake.createPdf(docDefinition);
  }

  getPdfDataUrl(pdfDoc: { getBase64: (cb: (data: string) => void) => void }): Promise<string> {
    return new Promise<string>((resolve) => {
      pdfDoc.getBase64((base64Data: string) => {
        resolve(`data:application/pdf;base64,${base64Data}`);
      });
    });
  }

  async savePdfFromBase64(base64Data: string, filename: string): Promise<string> {
    const safeFilename = this.generateSafeFilename(filename);
    const result = await Filesystem.writeFile({
      path: safeFilename,
      data: base64Data,
      directory: Directory.Cache,
    });
    this.currentPdfPath = result.uri;
    this.currentPdfFilename = safeFilename;
    this.currentPdfPathForCleanup = safeFilename;
    return result.uri;
  }

  async savePdfToDevice(pdfDoc: { getBase64: (cb: (data: string) => void) => void }, filename: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      pdfDoc.getBase64((base64Data: string) => {
        const safeFilename = this.generateSafeFilename(filename);
        Filesystem.writeFile({
          path: safeFilename,
          data: base64Data,
          directory: Directory.Cache,
        })
          .then((result) => {
            this.currentPdfPath = result.uri;
            this.currentPdfFilename = safeFilename;
            this.currentPdfPathForCleanup = safeFilename;
            resolve(result.uri);
          })
          .catch((error) => {
            console.error('PDF Service: Error saving PDF:', error);
            reject(new Error('Failed to save PDF to device'));
          });
      });
    });
  }

  private generateSafeFilename(filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const base = safe.endsWith('.pdf') ? safe.slice(0, -4) : safe;
    return `${base}.pdf`;
  }

  async sharePdf(pdfPath?: string, filename?: string): Promise<void> {
    const pathToShare = pdfPath ?? this.currentPdfPath;
    if (!pathToShare) {
      throw new Error('No PDF file available to share');
    }

    await Share.share({
      title: this.currentEmailSubject ?? 'Share PDF',
      text: this.currentEmailBody ?? filename ?? 'Document',
      url: pathToShare,
      dialogTitle: 'Share PDF Document',
    });

    try {
      await this.cleanupPreviousPdf();
    } catch {
      // Ignore cleanup errors
    }
  }

  setShareMetadata(subject?: string, body?: string): void {
    this.currentEmailSubject = subject ?? null;
    this.currentEmailBody = body ?? null;
  }

  private buildFooter(): (currentPage: number, pageCount: number) => object {
    return (currentPage: number, pageCount: number) => ({
      margin: [40, 0, 40, 20],
      columns: [
        {
          width: '*',
          stack: [
            { text: APP_NAME, style: 'footnote', margin: [0, 0, 0, 0] },
            { text: APP_WEBSITE, style: 'footnote', fontSize: 8, color: '#666', margin: [0, 1, 0, 0] },
          ],
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'right',
          fontSize: 9,
          color: '#777',
          width: 'auto',
        },
      ],
    });
  }

  private async cleanupPreviousPdf(): Promise<void> {
    const pathForCleanup = this.currentPdfPathForCleanup;
    if (pathForCleanup) {
      try {
        const fileExists = await Filesystem.stat({
          path: pathForCleanup,
          directory: Directory.Cache,
        })
          .then(() => true)
          .catch(() => false);

        if (fileExists) {
          await Filesystem.deleteFile({
            path: pathForCleanup,
            directory: Directory.Cache,
          });
        }
      } catch (error: unknown) {
        const msg = (error as Error)?.message ?? '';
        if (
          !msg.includes('permission') &&
          !msg.includes('denied') &&
          !msg.includes('Operation not permitted')
        ) {
          console.warn('PDF Service: Cleanup error (non-critical):', msg);
        }
      }

      this.currentPdfPath = null;
      this.currentPdfFilename = null;
      this.currentPdfPathForCleanup = null;
      this.currentEmailSubject = null;
      this.currentEmailBody = null;
    }
  }

  async cleanup(): Promise<void> {
    await this.cleanupPreviousPdf();
  }
}
