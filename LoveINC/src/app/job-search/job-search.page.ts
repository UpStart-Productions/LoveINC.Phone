import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActionSheetController, NavController } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import { SERVICES_ACTION_SHEET_CLASS } from '../shared/action-sheet-classes';
import { navigateAppForward } from '../shared/utils/navigation-forward.util';
import type { PlatformJobListing } from '../services/platform/types';
import { JobListingsStore } from './job-listings.store';
import { SavedJobsService } from './saved-jobs.service';
import {
  groupJobsByCompany,
  jobMatchesSearch,
  mapCompanyToListItem,
  sortCompanyGroups,
  type CompanySort,
} from './job-listing.mapper';

export { JobSearchCompanyPage } from './job-search-company.page';
export { JobSearchSavedPage } from './job-search-saved.page';

@Component({
  selector: 'app-job-search',
  templateUrl: './job-search.page.html',
  styleUrls: ['./job-search.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonSpinner,
    IonSearchbar,
    LucideAngularModule,
    AppBackButtonComponent,
    ContentCardListComponent,
  ],
})
export class JobSearchPage implements OnInit, OnDestroy {
  private readonly store = inject(JobListingsStore);
  private readonly savedJobs = inject(SavedJobsService);
  private readonly navController = inject(NavController);
  private readonly router = inject(Router);
  private readonly actionSheetController = inject(ActionSheetController);
  private savedSub?: Subscription;

  loading = true;
  jobs: PlatformJobListing[] = [];
  listItems: ContentCardListItem[] = [];
  searchQuery = '';
  savedCount = 0;

  get savedBadgeLabel(): string {
    return this.savedCount > 99 ? '99+' : String(this.savedCount);
  }

  get searchPlaceholder(): string {
    const count = this.jobs.length;
    const city = this.store.getAffiliateCity();
    const near = city ? ` near ${city}` : '';
    if (!count) return `Search jobs${near}`;
    const jobs = count === 1 ? '1 job' : `${count} jobs`;
    return `Search ${jobs}${near}`;
  }

  get canSortByDistance(): boolean {
    return this.store.canSortByDistance();
  }

  get distanceSortLabel(): string | null {
    return this.store.distanceSortLabel();
  }

  ngOnInit(): void {
    this.savedSub = this.savedJobs.watch().subscribe((rows) => {
      this.savedCount = rows.length;
    });
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.savedSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    if (!this.loading) {
      this.loadJobs(true);
    }
  }

  onSearchChange(event: CustomEvent | Event): void {
    let value: string | null | undefined = '';
    const customEvent = event as CustomEvent<{ value?: string }>;
    if (customEvent?.detail?.value !== undefined) {
      value = customEvent.detail.value;
    } else {
      const target = event?.target as HTMLIonSearchbarElement | undefined;
      if (target?.value !== undefined && target?.value !== null) {
        value = target.value;
      }
    }
    const query = String(value ?? '').toLowerCase().trim();
    this.searchQuery = query;
    this.performSearch(query);
  }

  onSearchClear(): void {
    this.searchQuery = '';
    this.performSearch('');
  }

  async openSort(): Promise<void> {
    const buttons = [
      { text: 'Date', icon: 'calendar-outline', handler: () => this.applySort('date') },
      { text: 'Salary range', icon: 'wallet-outline', handler: () => this.applySort('salary') },
      { text: 'Company name', icon: 'business-outline', handler: () => this.applySort('name') },
    ];
    if (this.canSortByDistance && this.distanceSortLabel) {
      buttons.push({
        text: this.distanceSortLabel,
        icon: 'location-outline',
        handler: () => this.applySort('distance'),
      });
    }
    const actionSheet = await this.actionSheetController.create({
      header: 'Sort Jobs',
      cssClass: SERVICES_ACTION_SHEET_CLASS,
      buttons,
    });
    await actionSheet.present();
  }

  openSaved(): void {
    void navigateAppForward(this.navController, this.router, '/tabs/job-search/saved', {
      queryParams: { from: 'job-search' },
    });
  }

  private applySort(sort: CompanySort): void {
    this.store.setSort(sort);
    this.performSearch(this.searchQuery);
  }

  private loadJobs(force = false): void {
    this.loading = true;
    this.store.load(force).subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.performSearch(this.searchQuery);
        this.loading = false;
        void this.store.ensureJobCoordinates().then(() => {
          this.jobs = this.store.peek();
          this.performSearch(this.searchQuery);
        });
      },
    });
  }

  private performSearch(query: string): void {
    const source = query
      ? this.jobs.filter((job) => jobMatchesSearch(job, query))
      : this.jobs;
    this.listItems = sortCompanyGroups(
      groupJobsByCompany(source),
      this.store.getSort(),
      this.store.getDistanceOrigin(),
    ).map((group) => mapCompanyToListItem(group, this.store.getDistanceOrigin()));
  }
}
