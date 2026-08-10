import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { CardComponent } from '../components/card/card.component';
import { PlatformApiService } from '../services/platform';
import type { PlatformImpactStory } from '../services/platform/types';
import { SharingService } from '../services/sharing/sharing.service';

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
    IonButtons,
    CardComponent,
    AppBackButtonComponent]})
export class ImpactStoriesPage implements OnInit {
  stories: PlatformImpactStory[] = [];

  constructor(
    private router: Router,
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
    this.router.navigate(['/tabs/content-detail', 'impact-story', story.id], {
      queryParams: { from: 'impact-stories' }});
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
