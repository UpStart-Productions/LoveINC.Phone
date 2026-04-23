import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBackButton,
} from '@ionic/angular/standalone';
import { JournalService } from './services/journal.service';
import { JournalEntry } from './types/journal-entry.model';

@Component({
  selector: 'app-journal-list',
  templateUrl: './journal-list.page.html',
  styleUrls: ['./journal-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBackButton,
  ],
})
export class JournalListPage {
  entries: JournalEntry[] = [];
  loading = true;

  constructor(
    private journalService: JournalService,
    private router: Router
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.loading = true;
    try {
      this.entries = await this.journalService.getAll();
    } finally {
      this.loading = false;
    }
  }

  addEntry(): void {
    void this.router.navigate(['/tabs/journal', 'new']);
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }
}
