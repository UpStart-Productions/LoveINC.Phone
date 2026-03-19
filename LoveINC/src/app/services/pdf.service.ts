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

/** Custom table layout: 1px light grey horizontal lines only, more padding, no top/bottom outer borders */
const BUDGET_TABLE_LAYOUT = {
  hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
    i === 0 || i === node.table.body.length ? 0 : 1,
  vLineWidth: () => 0,
  hLineColor: () => '#e8e8e8',
  vLineColor: () => '#e8e8e8',
  paddingLeft: () => 10,
  paddingRight: () => 10,
  paddingTop: () => 8,
  paddingBottom: () => 8,
};

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

  async createPdfFromHtml(htmlContent: string, title?: string, subtitle?: string): Promise<ReturnType<typeof pdfMake.createPdf>> {
    const modifiedHtml = htmlContent
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '<b style="font-size: 12px; display: block; margin: 4px 0;">$1</b>')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '<b style="font-size: 12px; display: block; margin: 6px 0;">$1</b>')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<b style="font-size: 12px; display: block; margin: 5px 0;">$1</b>')
      .replace(/<ion-chip[^>]*>(.*?)<\/ion-chip>/gi, '<span style="display: inline-block; background: #f0f0f0; padding: 2px 6px; margin: 1px; border-radius: 3px; font-size: 10px;">$1</span>');

    const pdfContent = this.htmlToPdfmake(modifiedHtml);
    let contentArray = (Array.isArray(pdfContent) ? pdfContent : [pdfContent]) as Content[];
    contentArray = this.applyTableLayout(contentArray, 'budgetTable');
    contentArray = this.stripTableCellBorders(contentArray);
    contentArray = this.applyTableWidths(contentArray);

    const headerContent: Content[] = [];
    if (title) {
      headerContent.push({ text: title, style: 'header', margin: [0, 0, 0, subtitle?.trim() ? 4 : 20] as [number, number, number, number] });
    }
    if (subtitle?.trim()) {
      headerContent.push({ text: subtitle.trim(), style: 'subtitle', margin: [0, 0, 0, 20] as [number, number, number, number] });
    }

    const docDefinition: TDocumentDefinitions = {
      content: [...headerContent, ...contentArray],
      footer: this.buildFooter() as TDocumentDefinitions['footer'],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
        },
        subtitle: {
          fontSize: 11,
          color: '#666',
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

    const tableLayouts = { budgetTable: BUDGET_TABLE_LAYOUT };
    return this.pdfMake.createPdf(docDefinition, tableLayouts);
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

  async openPdfInNativeViewer(filePath: string): Promise<void> {
    await FileOpener.open({
      filePath,
      contentType: 'application/pdf',
      openWithDefault: true,
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

  private applyTableLayout(content: Content[], layout: string): Content[] {
    return content.map((item) => {
      const obj = item as unknown as Record<string, unknown>;
      if (!obj || typeof obj !== 'object') return item;
      if (obj['table']) {
        const table = obj['table'] as { body?: unknown[][] };
        const body = table?.body;
        if (Array.isArray(body)) {
          const newBody = body.map((row) =>
            Array.isArray(row)
              ? row.map((cell) => this.applyTableLayoutToCell(cell as Record<string, unknown>, layout))
              : row
          );
          return { ...obj, layout, table: { ...table, body: newBody } } as Content;
        }
        return { ...obj, layout } as Content;
      }
      const stack = obj['stack'];
      if (Array.isArray(stack)) {
        return { ...obj, stack: this.applyTableLayout(stack as Content[], layout) } as Content;
      }
      const columns = obj['columns'];
      if (Array.isArray(columns)) {
        return {
          ...obj,
          columns: columns.map((col: unknown) => {
            const colObj = col as unknown as Record<string, unknown>;
            const colStack = colObj?.['stack'];
            if (Array.isArray(colStack)) {
              return { ...colObj, stack: this.applyTableLayout(colStack as Content[], layout) };
            }
            return col;
          }),
        } as Content;
      }
      return item;
    });
  }

  private applyTableLayoutToCell(cell: Record<string, unknown>, layout: string): Record<string, unknown> {
    const stack = cell['stack'];
    if (Array.isArray(stack)) {
      return { ...cell, stack: this.applyTableLayout(stack as Content[], layout) };
    }
    return cell;
  }

  private stripTableCellBorders(content: Content[]): Content[] {
    return content.map((item) => {
      const obj = item as unknown as Record<string, unknown>;
      if (!obj || typeof obj !== 'object') return item;
      if (obj['table']) {
        const table = obj['table'] as { body?: unknown[][] };
        const body = table?.body;
        if (Array.isArray(body)) {
          const newBody = body.map((row) =>
            Array.isArray(row)
              ? row.map((cell) => this.stripCellBorders(cell as Record<string, unknown>))
              : row
          );
          return { ...obj, table: { ...table, body: newBody } } as Content;
        }
        return item;
      }
      const stack = obj['stack'];
      if (Array.isArray(stack)) {
        return { ...obj, stack: this.stripTableCellBorders(stack as Content[]) } as Content;
      }
      const columns = obj['columns'];
      if (Array.isArray(columns)) {
        return {
          ...obj,
          columns: columns.map((col: unknown) => {
            const colObj = col as unknown as Record<string, unknown>;
            const colStack = colObj?.['stack'];
            if (Array.isArray(colStack)) {
              return { ...colObj, stack: this.stripTableCellBorders(colStack as Content[]) };
            }
            return col;
          }),
        } as Content;
      }
      return item;
    });
  }

  private applyTableWidths(content: Content[]): Content[] {
    return content.map((item) => {
      const obj = item as unknown as Record<string, unknown>;
      if (!obj || typeof obj !== 'object') return item;
      if (obj['table']) {
        const table = obj['table'] as { body?: unknown[][]; widths?: unknown[] };
        const body = table?.body;
        if (Array.isArray(body) && body.length > 0) {
          const firstRow = body[0];
          const colCount = Array.isArray(firstRow) ? firstRow.length : 0;
          let widths: unknown[] | undefined;
          if (colCount === 2) {
            widths = ['50%', '50%'];
          } else if (colCount === 6) {
            widths = ['*', '*', '*', '*', '*', '*'];
          }
          if (widths) {
            const newBody = body.map((row) =>
              Array.isArray(row)
                ? row.map((cell) => this.applyTableWidthsToCell(cell as Record<string, unknown>))
                : row
            );
            return { ...obj, table: { ...table, body: newBody, widths } } as Content;
          }
          const newBody = body.map((row) =>
            Array.isArray(row)
              ? row.map((cell) => this.applyTableWidthsToCell(cell as Record<string, unknown>))
              : row
          );
          return { ...obj, table: { ...table, body: newBody } } as Content;
        }
        return item;
      }
      const stack = obj['stack'];
      if (Array.isArray(stack)) {
        return { ...obj, stack: this.applyTableWidths(stack as Content[]) } as Content;
      }
      const columns = obj['columns'];
      if (Array.isArray(columns)) {
        return {
          ...obj,
          columns: columns.map((col: unknown) => {
            const colObj = col as unknown as Record<string, unknown>;
            const colStack = colObj?.['stack'];
            if (Array.isArray(colStack)) {
              return { ...colObj, stack: this.applyTableWidths(colStack as Content[]) };
            }
            return col;
          }),
        } as Content;
      }
      return item;
    });
  }

  private applySummaryCellMargins(content: Content[]): Content[] {
    const summaryMargin: [number, number, number, number] = [0, 10, 0, 0];
    return content.map((item) => {
      const obj = item as unknown as Record<string, unknown>;
      if (!obj || typeof obj !== 'object') return item;
      if (obj['table']) {
        const table = obj['table'] as { body?: unknown[][] };
        const body = table?.body;
        if (Array.isArray(body) && body.length > 0) {
          const firstRow = body[0];
          const colCount = Array.isArray(firstRow) ? firstRow.length : 0;
          const firstCell = Array.isArray(firstRow) ? firstRow[0] : null;
          const firstCellText = this.getCellText(firstCell);
          const isSummaryTable =
            colCount === 2 &&
            body.length >= 5 &&
            (firstCellText?.includes('Starting balance') ||
              firstCellText?.includes('Total income') ||
              firstCellText?.includes('Money available'));
          if (isSummaryTable) {
            const newBody = body.map((row) =>
              Array.isArray(row)
                ? row.map((cell, colIdx) =>
                    colIdx === 0 ? this.addCellMargin(cell as Record<string, unknown>, summaryMargin) : cell
                  )
                : row
            );
            return { ...obj, table: { ...table, body: newBody } } as Content;
          }
        }
        const newBody = body?.map((row) =>
          Array.isArray(row)
            ? row.map((cell) => this.applySummaryCellMarginsToCell(cell as Record<string, unknown>))
            : row
        );
        return newBody ? { ...obj, table: { ...table, body: newBody } } as Content : item;
      }
      const stack = obj['stack'];
      if (Array.isArray(stack)) {
        return { ...obj, stack: this.applySummaryCellMargins(stack as Content[]) } as Content;
      }
      const columns = obj['columns'];
      if (Array.isArray(columns)) {
        return {
          ...obj,
          columns: columns.map((col: unknown) => {
            const colObj = col as unknown as Record<string, unknown>;
            const colStack = colObj?.['stack'];
            if (Array.isArray(colStack)) {
              return { ...colObj, stack: this.applySummaryCellMargins(colStack as Content[]) };
            }
            return col;
          }),
        } as Content;
      }
      return item;
    });
  }

  private getCellText(cell: unknown): string | null {
    if (!cell || typeof cell !== 'object') return null;
    const c = cell as Record<string, unknown>;
    if (typeof c['text'] === 'string') return c['text'] as string;
    const stack = c['stack'];
    if (Array.isArray(stack) && stack.length > 0) {
      const first = stack[0];
      if (first && typeof first === 'object' && typeof (first as Record<string, unknown>)['text'] === 'string') {
        return (first as Record<string, unknown>)['text'] as string;
      }
    }
    return null;
  }

  private addCellMargin(cell: Record<string, unknown>, margin: [number, number, number, number]): Record<string, unknown> {
    if (cell['text'] !== undefined) {
      return { ...cell, margin };
    }
    const stack = cell['stack'];
    if (Array.isArray(stack) && stack.length > 0) {
      const first = stack[0] as Record<string, unknown>;
      if (first?.['text'] !== undefined) {
        return { ...cell, stack: [{ ...first, margin }, ...stack.slice(1)] };
      }
    }
    return cell;
  }

  private applySummaryCellMarginsToCell(cell: Record<string, unknown>): Record<string, unknown> {
    const stack = cell['stack'];
    if (Array.isArray(stack)) {
      return { ...cell, stack: this.applySummaryCellMargins(stack as Content[]) };
    }
    return cell;
  }

  private applyTableWidthsToCell(cell: Record<string, unknown>): Record<string, unknown> {
    const stack = cell['stack'];
    if (Array.isArray(stack)) {
      return { ...cell, stack: this.applyTableWidths(stack as Content[]) };
    }
    return cell;
  }

  private stripCellBorders(cell: Record<string, unknown>): Record<string, unknown> {
    const next = { ...cell };
    delete next['border'];
    delete next['borderColor'];
    const stack = next['stack'];
    if (Array.isArray(stack)) {
      return { ...next, stack: this.stripTableCellBorders(stack as Content[]) };
    }
    return next;
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
