import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  IonList,
  IonItem,
  IonInput,
  IonIcon,
} from '@ionic/angular/standalone';
import { JournalService } from './services/journal.service';
import {
  JournalQuillEditorComponent,
  type JournalQuillEditorConfig,
} from './rich-text/quill-editor.component';
import { JournalEntry } from './types/journal-entry.model';

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
    IonBackButton,
    IonList,
    IonItem,
    IonInput,
    IonIcon,
    JournalQuillEditorComponent,
  ],
})
export class JournalEntryPage implements OnInit {
  title = '';
  content = '';
  isNew = true;
  entryId: number | null = null;
  saving = false;
  loading = true;
  quillConfig: JournalQuillEditorConfig = {
    placeholder: 'Write your thoughts…',
    height: 'min(55vh, 400px)',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private journalService: JournalService,
    private alertController: AlertController
  ) {}

  async ngOnInit(): Promise<void> {
    const pathTail = this.route.snapshot.url[0]?.path;
    this.isNew = pathTail === 'new';
    this.loading = true;
    if (this.isNew) {
      this.title = '';
      this.content = '';
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
        await this.router.navigateByUrl('/tabs/journal', { replaceUrl: true });
      }
    }
    this.loading = false;
  }

  private hydrateFromEntry(e: JournalEntry): void {
    this.title = e.title;
    this.content = e.content;
  }

  backHref(): string {
    return '/tabs/journal';
  }

  async save(): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    try {
      if (this.isNew) {
        const t = this.title.trim();
        const c = this.content;
        const id = await this.journalService.create({ title: t, content: c });
        await this.router.navigate(['/tabs/journal', id], { replaceUrl: true });
        this.isNew = false;
        this.entryId = id;
        const loaded = await this.journalService.getById(id);
        if (loaded) {
          this.hydrateFromEntry(loaded);
        }
      } else if (this.entryId != null) {
        const t = this.title.trim();
        const c = this.content;
        await this.journalService.update(this.entryId, { title: t, content: c });
        await this.router.navigateByUrl('/tabs/journal');
      }
    } finally {
      this.saving = false;
    }
  }

  async confirmDelete(): Promise<void> {
    if (this.isNew || this.entryId == null) return;
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
}
