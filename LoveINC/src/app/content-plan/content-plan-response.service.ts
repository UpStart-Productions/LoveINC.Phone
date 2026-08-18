import { Injectable } from '@angular/core';
import { JournalService } from '@upstart-productions/journal';
import { GrovLinkDatabaseService } from '../services/grovlink-database.service';
import type { ContentPlanBlock } from './content-plan.model';
import {
  buildContentPlanInputKey,
  formatJournalCheckboxAppend,
  formatJournalRadioAppend,
  formatJournalTextAppend,
} from './content-plan-response.util';

export interface ContentPlanResponseContext {
  planId: string;
  planTitle: string;
  themeName: string;
  planMomentId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContentPlanResponseService {
  constructor(
    private readonly db: GrovLinkDatabaseService,
    private readonly journalService: JournalService
  ) {}

  async loadResponses(planId: string): Promise<Record<string, string | string[]>> {
    if (!planId.trim()) {
      return {};
    }
    return this.db.getContentPlanResponses(planId);
  }

  async saveTextResponse(
    context: ContentPlanResponseContext,
    block: ContentPlanBlock,
    value: string,
    previousValue?: string
  ): Promise<void> {
    const inputKey = buildContentPlanInputKey(context.planMomentId, block);
    const prior =
      previousValue ??
      (await this.readStoredValue(context.planId, inputKey, 'text'));
    await this.db.saveContentPlanResponse(context.planId, inputKey, value);
    const appendHtml = formatJournalTextAppend(
      typeof prior === 'string' ? prior : undefined,
      value
    );
    await this.appendJournal(context, appendHtml);
  }

  async saveRadioResponse(
    context: ContentPlanResponseContext,
    block: ContentPlanBlock,
    value: string,
    previousValue?: string
  ): Promise<void> {
    const inputKey = buildContentPlanInputKey(context.planMomentId, block);
    const prior =
      previousValue ??
      (await this.readStoredValue(context.planId, inputKey, 'text'));
    await this.db.saveContentPlanResponse(context.planId, inputKey, value);
    const appendHtml = formatJournalRadioAppend(
      typeof prior === 'string' ? prior : undefined,
      value
    );
    await this.appendJournal(context, appendHtml);
  }

  async saveCheckboxResponse(
    context: ContentPlanResponseContext,
    block: ContentPlanBlock,
    value: string[],
    previousValue?: string[]
  ): Promise<void> {
    const inputKey = buildContentPlanInputKey(context.planMomentId, block);
    const stored = await this.db.getContentPlanResponses(context.planId);
    const prior =
      previousValue ??
      (Array.isArray(stored[inputKey]) ? (stored[inputKey] as string[]) : []);
    await this.db.saveContentPlanResponse(context.planId, inputKey, value);
    const appendHtml = formatJournalCheckboxAppend(prior, value);
    await this.appendJournal(context, appendHtml);
  }

  private async readStoredValue(
    planId: string,
    inputKey: string,
    kind: 'text' | 'array'
  ): Promise<string | string[] | undefined> {
    const stored = await this.db.getContentPlanResponses(planId);
    const value = stored[inputKey];
    if (kind === 'text' && typeof value === 'string') {
      return value;
    }
    if (kind === 'array' && Array.isArray(value)) {
      return value;
    }
    return undefined;
  }

  private async appendJournal(
    context: ContentPlanResponseContext,
    appendHtml: string
  ): Promise<void> {
    if (!appendHtml.trim()) {
      return;
    }
    try {
      await this.journalService.appendPlanJournalEntry({
        planId: context.planId,
        planTitle: context.planTitle,
        themeName: context.themeName,
        appendHtml,
      });
    } catch (err) {
      console.warn('ContentPlanResponseService: failed to append journal entry', err);
    }
  }
}
