import { Component, OnInit, Inject, Optional, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
  IonIcon,
  IonCard,
  NavController,
} from '@ionic/angular/standalone';
import {
  VerseOfTheDayService,
  VerseOfTheDay,
  VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL,
  VERSE_OF_THE_DAY_SHARE,
} from './verse-of-the-day.service';
import { SafeResourceUrlPipe } from './safe-resource-url.pipe';
import { navigateAppBack } from '@app/shared/utils/navigation-back.util';

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
    IonButtons,
    IonButton,
    IonSpinner,
    IonIcon,
    IonCard,
    SafeResourceUrlPipe,
  ],
})
export class VerseOfTheDayPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly navController = inject(NavController);

  verse: VerseOfTheDay | null = null;
  loading = true;
  error = false;

  constructor(
    private readonly verseOfTheDayService: VerseOfTheDayService,
    @Optional() @Inject(VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL) private readonly youtubeEmbedBaseUrl?: string,
    @Optional() @Inject(VERSE_OF_THE_DAY_SHARE) readonly shareHandler?: (verse: VerseOfTheDay) => Promise<void>
  ) {}

  ngOnInit() {
    this.loadVerse();
  }

  goBack(): void {
    void navigateAppBack(this.navController, this.route.snapshot, '/tabs/home');
  }

  get sermonVideoId(): string | null {
    if (!this.verse?.sermonUrl) return null;
    const match = this.verse.sermonUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    return match ? match[1] : null;
  }

  get sermonEmbedUrl(): string | null {
    const videoId = this.sermonVideoId;
    if (!videoId || !this.youtubeEmbedBaseUrl?.trim()) return null;
    const base = this.youtubeEmbedBaseUrl.replace(/\/$/, '');
    return `${base}/youtube.html?v=${encodeURIComponent(videoId)}`;
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

  async onShare() {
    if (!this.verse || !this.shareHandler) return;
    await this.shareHandler(this.verse);
  }
}
