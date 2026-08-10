import { Component, Inject, Optional } from '@angular/core';
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
  IonCard,
  IonBadge,
} from '@ionic/angular/standalone';
import { JournalService } from './services/journal.service';
import { JournalEntry } from './types/journal-entry.model';
import {
  JOURNAL_NAVIGATION_RETURN,
  type JournalNavigationReturnHandler,
} from './journal-navigation-return.token';

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
    IonCard,
    IonBadge,
  ],
})
export class JournalListPage {
  entries: JournalEntry[] = [];
  loading = true;

  readonly defaultBackHref = '/tabs/tools';

  constructor(
    private journalService: JournalService,
    private router: Router,
    @Optional() @Inject(JOURNAL_NAVIGATION_RETURN)
    private readonly navigationReturn?: JournalNavigationReturnHandler
  ) {}

  onBackClick(event: Event): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.navigationReturn) {
      this.navigationReturn.goBack(this.defaultBackHref);
      return;
    }
    void this.router.navigateByUrl(this.defaultBackHref);
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
