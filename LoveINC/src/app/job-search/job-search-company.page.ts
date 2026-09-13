import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
  NavController,
} from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import { navigateAppForward } from '../shared/utils/navigation-forward.util';
import type { PlatformJobListing } from '../services/platform/types';
import { JobListingsStore } from './job-listings.store';
import { SavedJobsService } from './saved-jobs.service';
import { mapJobToListItem, sortJobsByDistance } from './job-listing.mapper';

@Component({
  selector: 'app-job-search-company',
  templateUrl: './job-search-company.page.html',
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
    LucideAngularModule,
    AppBackButtonComponent,
    ContentCardListComponent,
  ],
})
export class JobSearchCompanyPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(JobListingsStore);
  private readonly savedJobs = inject(SavedJobsService);
  private readonly navController = inject(NavController);
  private readonly router = inject(Router);
  private savedSub?: Subscription;

  loading = true;
  companyName = '';
  jobs: PlatformJobListing[] = [];
  listItems: ContentCardListItem[] = [];
  savedCount = 0;

  get savedBadgeLabel(): string {
    return this.savedCount > 99 ? '99+' : String(this.savedCount);
  }

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('companyKey') ?? '';
    try {
      this.companyName = decodeURIComponent(raw);
    } catch {
      this.companyName = raw;
    }
    this.savedSub = this.savedJobs.watch().subscribe((rows) => {
      this.savedCount = rows.length;
      this.refreshList();
    });
    this.store.load().subscribe({
      next: (all) => {
        const forCompany = all.filter(
          (job) => (job.companyName?.trim() || 'Unknown') === this.companyName,
        );
        const origin = this.store.getDistanceOrigin();
        this.jobs =
          this.store.getSort() === 'distance' && origin
            ? sortJobsByDistance(forCompany, origin)
            : [...forCompany].sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
        this.refreshList();
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.savedSub?.unsubscribe();
  }

  onJobClick(item: ContentCardListItem): void {
    const job = this.jobs.find((j) => j.id === item.id);
    if (job?.applyUrl) {
      void this.openApplyUrl(job.applyUrl);
    }
  }

  onSaveClick(item: ContentCardListItem): void {
    const job = this.jobs.find((j) => j.id === item.id);
    if (job) this.savedJobs.toggle(job);
  }

  openSaved(): void {
    void navigateAppForward(this.navController, this.router, '/tabs/job-search/saved', {
      queryParams: { from: this.router.url },
    });
  }

  private refreshList(): void {
    this.listItems = this.jobs.map((job) =>
      mapJobToListItem(job, { saved: this.savedJobs.isSaved(job.id) }),
    );
  }

  private async openApplyUrl(url: string): Promise<void> {
    try {
      await Browser.open({ url });
    } catch (err) {
      console.error('JobSearchCompanyPage.openApplyUrl', err);
      window.open(url, '_blank');
    }
  }
}
