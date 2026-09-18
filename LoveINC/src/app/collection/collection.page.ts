import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import { PlatformApiService } from '../services/platform';
import { mapCollectionMembersToListItems } from './collection.mapper';

@Component({
  selector: 'app-collection-page',
  templateUrl: './collection.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    ContentCardListComponent,
    AppBackButtonComponent,
  ],
})
export class CollectionPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly platformApi = inject(PlatformApiService);

  listItems: ContentCardListItem[] = [];
  pageTitle = 'Collection';
  loading = true;
  backFallback = '/tabs/home';

  ngOnInit(): void {
    const from = this.route.snapshot.queryParamMap.get('from')?.trim();
    if (from) {
      this.backFallback = `/tabs/${from}`;
    }
    this.loadCollection();
  }

  private loadCollection(): void {
    const collectionId = this.route.snapshot.paramMap.get('collectionId')?.trim() ?? '';
    if (!collectionId) {
      this.listItems = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.platformApi.getServiceCollectionById(collectionId).subscribe({
      next: (collection) => {
        if (!collection) {
          this.pageTitle = 'Collection';
          this.listItems = [];
          this.loading = false;
          return;
        }
        this.pageTitle = collection.title?.trim() || 'Collection';
        this.listItems = mapCollectionMembersToListItems(
          collection,
          (path) => this.platformApi.resolveUploadUrl(path),
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading collection:', err);
        this.pageTitle = 'Collection';
        this.listItems = [];
        this.loading = false;
      },
    });
  }
}
