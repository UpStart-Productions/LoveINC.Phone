import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  NavController,
} from '@ionic/angular/standalone';
import { CardComponent } from '../components/card/card.component';
import { PlatformApiService } from '../services/platform';
import type { PlatformImpactStory } from '../services/platform/types';
import { SharingService } from '../services/sharing/sharing.service';
import { navigateAppForward } from '../shared/utils/navigation-forward.util';

@Component({
  selector: 'app-impact-stories',
  templateUrl: './impact-stories.page.html',
  styleUrls: ['./impact-stories.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    CardComponent,
  ],
})
export class ImpactStoriesPage implements OnInit {
  stories: PlatformImpactStory[] = [];

  constructor(
    private router: Router,
    private navController: NavController,
    private platformApi: PlatformApiService,
    private sharingService: SharingService
  ) {}

  ngOnInit() {
    this.loadStories();
  }

  loadStories() {
    this.platformApi.getImpactStories().subscribe({
      next: (items) => {
        this.stories = (items ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
      },
      error: (err) => {
        console.error('Error loading impact stories:', err);
      }});
  }

  getPhotoUrl(story: PlatformImpactStory): string {
    return this.platformApi.resolveUploadUrl(story.photoUrl) || story.photoUrl || '';
  }

  navigateToDetail(story: PlatformImpactStory) {
    void navigateAppForward(this.navController, this.router, ['/tabs/content-detail', 'impact-story', story.id], {
      queryParams: { from: 'impact-stories' },
    });
  }

  async onShareStory(story: PlatformImpactStory) {
    const description = story.longDescription ?? story.shortDescription ?? '';
    const htmlContent = `
      <h2>${story.title}</h2>
      ${description ? `<p>${description}</p>` : ''}
    `;
    await this.sharingService.shareContent({
      title: story.title,
      subject: `Love INC Impact: ${story.title}`,
      htmlContent});
  }
}
