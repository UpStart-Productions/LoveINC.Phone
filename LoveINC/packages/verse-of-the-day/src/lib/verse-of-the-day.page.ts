import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import {
  VerseOfTheDayService,
  VerseOfTheDay,
  VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL,
  VERSE_OF_THE_DAY_SHARE,
  VERSE_OF_THE_DAY_BACK_DEFAULT_HREF,
  APP_NAVIGATION_RETURN,
  type AppNavigationReturnHandler,
} from './verse-of-the-day.service';
import { SafeResourceUrlPipe } from './safe-resource-url.pipe';

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

  backDefaultHref: string;

  constructor(
    private readonly verseOfTheDayService: VerseOfTheDayService,
    private readonly router: Router,
    @Optional() @Inject(VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL) private readonly youtubeEmbedBaseUrl?: string,
    @Optional() @Inject(VERSE_OF_THE_DAY_SHARE) readonly shareHandler?: (verse: VerseOfTheDay) => Promise<void>,
    @Optional() @Inject(VERSE_OF_THE_DAY_BACK_DEFAULT_HREF) backDefaultHref?: string,
    @Optional() @Inject(APP_NAVIGATION_RETURN)
    private readonly navigationReturn?: AppNavigationReturnHandler
  ) {
    this.backDefaultHref = backDefaultHref ?? '/tabs/more';
  }

  ngOnInit() {
    this.loadVerse();
  }

  onBackClick(event: Event): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.navigationReturn) {
      this.navigationReturn.goBack(this.backDefaultHref);
      return;
    }
    void this.router.navigateByUrl(this.backDefaultHref);
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
