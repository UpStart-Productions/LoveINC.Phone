import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Browser } from '@capacitor/browser';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import type { PlatformJobListing } from '../services/platform/types';
import { SavedJobsService } from './saved-jobs.service';
import { mapJobToListItem } from './job-listing.mapper';

@Component({
  selector: 'app-job-search-saved',
  templateUrl: './job-search-saved.page.html',
  styleUrls: ['./job-search.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    AppBackButtonComponent,
    ContentCardListComponent,
  ],
})
export class JobSearchSavedPage implements OnInit, OnDestroy {
  private readonly savedJobs = inject(SavedJobsService);
  private savedSub?: Subscription;

  jobs: PlatformJobListing[] = [];
  listItems: ContentCardListItem[] = [];

  ngOnInit(): void {
    this.savedSub = this.savedJobs.watch().subscribe(() => this.refreshList());
    this.refreshList();
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

  private refreshList(): void {
    this.jobs = this.savedJobs.list().map((row) => row.job);
    this.listItems = this.jobs.map((job) =>
      mapJobToListItem(job, { saved: true, staleDatePill: true }),
    );
  }

  private async openApplyUrl(url: string): Promise<void> {
    try {
      await Browser.open({ url });
    } catch (err) {
      console.error('JobSearchSavedPage.openApplyUrl', err);
      window.open(url, '_blank');
    }
  }
}
