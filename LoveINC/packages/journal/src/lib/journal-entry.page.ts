import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonInput,
  IonIcon,
} from '@ionic/angular/standalone';
import { JOURNAL_ENTRY_SHARE, type JournalEntryShareOptions } from './journal-entry-share.token';
import { JournalService } from './services/journal.service';
import {
  JournalQuillEditorComponent,
  type JournalQuillEditorConfig,
} from './rich-text/quill-editor.component';
import { JournalEntry } from './types/journal-entry.model';
import { navigateAppBack } from '@app/shared/utils/navigation-back.util';

@Component({
  selector: 'app-journal-entry',
  templateUrl: './journal-entry.page.html',
  styleUrls: ['./journal-entry.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonInput,
    IonIcon,
    JournalQuillEditorComponent,
  ],
})
export class JournalEntryPage implements OnInit, OnDestroy {
  private readonly shareViaAppActionSheet = inject(JOURNAL_ENTRY_SHARE, { optional: true });

  title = '';
  content = '';
  /** True when the route is `/tabs/journal/new` (only list → `:id` is "edit" in the URL). */
  routeIsNew = false;
  entryId: number | null = null;
  private saving = false;
  loading = true;
  navigatingAway = false;
  quillConfig: JournalQuillEditorConfig = {
    placeholder: 'Write your thoughts…',
    height: '100%',
  };

  private lastSavedTitle = '';
  private lastSavedContent = '';
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly autoSaveDelayMs = 1200;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navController: NavController,
    private journalService: JournalService,
    private alertController: AlertController
  ) {}

  ionViewWillEnter(): void {
    this.navigatingAway = false;
  }

  ionViewWillLeave(): void {
    this.navigatingAway = true;
  }

  ngOnDestroy(): void {
    this.clearAutoSaveTimer();
  }

  goBack(): void {
    this.navigatingAway = true;
    void navigateAppBack(this.navController, this.router, this.route.snapshot, '/tabs/journal');
  }

  async ngOnInit(): Promise<void> {
    this.navigatingAway = false;
    const pathTail = this.route.snapshot.url[0]?.path;
    this.routeIsNew = pathTail === 'new';
    this.loading = true;
    if (this.routeIsNew) {
      this.entryId = null;
      this.title = '';
      this.content = '';
      this.lastSavedTitle = '';
      this.lastSavedContent = '';
    } else {
      const id = pathTail ? parseInt(pathTail, 10) : NaN;
      if (Number.isNaN(id)) {
        this.loading = false;
        return;
      }
      this.entryId = id;
      const e = await this.journalService.getById(id);
      if (e) {
        this.hydrateFromEntry(e);
      } else {
        await this.navController.navigateBack('/tabs/journal');
      }
    }
    this.loading = false;
  }

  private hydrateFromEntry(e: JournalEntry): void {
    this.title = e.title;
    this.content = e.content;
    this.lastSavedTitle = e.title.trim();
    this.lastSavedContent = e.content;
  }

  /** True when there is a title or non-empty body (plain text), so Share is useful. */
  get canShareEntry(): boolean {
    if (this.loading) {
      return false;
    }
    if (this.title.trim().length > 0) {
      return true;
    }
    return this.plainTextFromContent(this.content).length > 0;
  }

  /** Debounced auto-save on title or body changes. */
  scheduleAutoSave(): void {
    if (this.loading) return;
    this.clearAutoSaveTimer();
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      void this.saveNow().catch((err) => console.error('Journal auto-save failed', err));
    }, this.autoSaveDelayMs);
  }

  private clearAutoSaveTimer(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private async waitForInFlightSave(): Promise<void> {
    const maxMs = 10_000;
    const start = Date.now();
    while (this.saving && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 40));
    }
  }

  /**
   * Persists if the current values differ from what was last written to the DB.
   * Does not create a row for a new entry until the user has non-empty title or content.
   */
  private async saveNow(): Promise<boolean> {
    if (this.loading) return true;
    if (this.saving) return true;

    const t = this.title.trim();
    const c = this.content;
    if (t === this.lastSavedTitle && c === this.lastSavedContent) return true;
    if (this.entryId == null && t === '' && c === '') return true;

    this.saving = true;
    try {
      if (this.entryId == null) {
        const id = await this.journalService.create({ title: t, content: c });
        this.entryId = id;
      } else {
        await this.journalService.update(this.entryId, { title: t, content: c });
      }
      this.lastSavedTitle = t;
      this.lastSavedContent = c;
      return true;
    } catch (err) {
      console.error('Journal auto-save failed', err);
      return false;
    } finally {
      this.saving = false;
    }
  }

  async shareEntry(): Promise<void> {
    this.clearAutoSaveTimer();
    await this.waitForInFlightSave();
    if (!(await this.saveNow())) {
      return;
    }
    if (!this.canShareEntry) {
      return;
    }
    const share = this.shareViaAppActionSheet;
    if (!share) {
      return;
    }
    const title = (this.title.trim() || 'Journal entry').replace(/\s+/g, ' ');
    const htmlContent = this.buildJournalShareHtml(title, this.content);
    const options: JournalEntryShareOptions = {
      title,
      subject: title,
      htmlContent,
    };
    try {
      await share(options);
    } catch {
      // Action sheet or share pipeline dismissed / failed
    }
  }

  private buildJournalShareHtml(heading: string, bodyHtml: string): string {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!bodyHtml || bodyHtml.trim() === '') {
      return `<h1>${esc(heading)}</h1>`;
    }
    return `<h1>${esc(heading)}</h1>\n${bodyHtml}`;
  }

  async confirmDelete(): Promise<void> {
    if (this.entryId == null) return;
    const a = await this.alertController.create({
      header: 'Delete entry',
      message: 'This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            void this.deleteEntry();
          },
        },
      ],
    });
    await a.present();
  }

  private async deleteEntry(): Promise<void> {
    if (this.entryId == null) return;
    await this.journalService.delete(this.entryId);
    await this.router.navigateByUrl('/tabs/journal');
  }

  private plainTextFromContent(html: string): string {
    if (html == null || html === '') {
      return '';
    }
    if (typeof document === 'undefined') {
      return String(html)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
    const d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent ?? d.innerText ?? '').replace(/\n{3,}/g, '\n\n').trim();
  }
}
