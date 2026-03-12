import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonSpinner,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { VerseOfTheDayService, VerseOfTheDay } from './verse-of-the-day.service';
import { SafeResourceUrlPipe } from '../shared/pipes/safe-resource-url.pipe';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-verse-of-the-day',
  templateUrl: './verse-of-the-day.page.html',
  styleUrls: ['./verse-of-the-day.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonSpinner,
    IonButton,
    IonIcon,
    SafeResourceUrlPipe,
  ],
})
export class VerseOfTheDayPage implements OnInit {
  verse: VerseOfTheDay | null = null;
  loading = true;
  error = false;

  constructor(private readonly verseOfTheDayService: VerseOfTheDayService) {}

  get sermonVideoId(): string | null {
    if (!this.verse?.sermonUrl) return null;
    const match = this.verse.sermonUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    return match ? match[1] : null;
  }

  get sermonEmbedUrl(): string | null {
    const videoId = this.sermonVideoId;
    if (!videoId || !environment.youtubeEmbedBaseUrl) return null;
    const base = environment.youtubeEmbedBaseUrl.replace(/\/$/, '');
    return `${base}/youtube.html?v=${encodeURIComponent(videoId)}`;
  }

  ngOnInit() {
    this.loadVerse();
  }

  loadVerse() {
    this.loading = true;
    this.error = false;
    this.verseOfTheDayService.getVerseOfTheDay().subscribe({
      next: (v) => {
        this.verse = v;
        this.loading = false;
        this.error = v == null;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }
}
