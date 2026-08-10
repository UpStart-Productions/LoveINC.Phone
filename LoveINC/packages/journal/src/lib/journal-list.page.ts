import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
  IonCard,
  IonBadge,
} from '@ionic/angular/standalone';
import { JournalService } from './services/journal.service';
import { JournalEntry } from './types/journal-entry.model';
import { resolveReturnUrlFromRouteTree } from './navigation-origin.util';

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
    IonCard,
    IonBadge,
  ],
})
export class JournalListPage {
  entries: JournalEntry[] = [];
  loading = true;

  constructor(
    private journalService: JournalService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  goBack(): void {
    const explicit = resolveReturnUrlFromRouteTree(this.route.snapshot);
    const target = explicit ?? '/tabs/tools';
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }

  async ionViewWillEnter(): Promise<void> {
    this.loading = true;
    try {
      this.entries = await this.journalService.getAll();
    } finally {
      this.loading = false;
    }
  }

  addEntry(): void {
    void this.router.navigate(['/tabs/journal', 'new'], {
      queryParamsHandling: 'preserve',
    });
  }

  private readonly monthAbbrev = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ] as const;

  /** e.g. "Apr 7" (3-letter month, day with no leading zero) in local time. */
  formatUpdatedMonthDay(iso: string): string {
    if (!iso) {
      return '';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return `${this.monthAbbrev[d.getMonth()]} ${d.getDate()}`;
  }
}
