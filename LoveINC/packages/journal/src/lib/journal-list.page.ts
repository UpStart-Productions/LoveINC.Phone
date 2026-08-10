import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
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
import { readNavigationOriginHref } from './navigation-origin';

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
export class JournalListPage implements OnInit {
  entries: JournalEntry[] = [];
  loading = true;
  originBackHref: string | null = null;

  constructor(
    private journalService: JournalService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.originBackHref = readNavigationOriginHref(this.route);
  }

  goBack(): void {
    if (this.originBackHref) {
      void this.router.navigateByUrl(this.originBackHref);
    }
  }

  onBackClick(event: Event): void {
    if (!this.originBackHref) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    this.goBack();
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
