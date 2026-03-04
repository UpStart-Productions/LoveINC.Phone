import { Component, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
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
import { YoutubePlayer } from '@capgo/capacitor-youtube-player';

const PLAYER_ID = 'sermon-youtube-player';

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
  ],
})
export class VerseOfTheDayPage implements OnInit, OnDestroy, AfterViewChecked {
  verse: VerseOfTheDay | null = null;
  loading = true;
  error = false;
  playerInitialized = false;
  private pendingVideoId: string | null = null;

  constructor(private readonly verseOfTheDayService: VerseOfTheDayService) {}

  get sermonVideoId(): string | null {
    if (!this.verse?.sermonUrl) return null;
    const match = this.verse.sermonUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    return match ? match[1] : null;
  }

  ngOnInit() {
    this.loadVerse();
  }

  ngAfterViewChecked() {
    if (this.pendingVideoId && !this.playerInitialized && document.getElementById(PLAYER_ID)) {
      const videoId = this.pendingVideoId;
      this.pendingVideoId = null;
      this.initPlayer(videoId);
    }
  }

  async ngOnDestroy() {
    if (this.playerInitialized) {
      try {
        await YoutubePlayer.destroy(PLAYER_ID);
      } catch {
        // Ignore
      }
      this.playerInitialized = false;
    }
  }

  loadVerse() {
    this.loading = true;
    this.error = false;
    if (this.playerInitialized) {
      YoutubePlayer.destroy(PLAYER_ID).catch(() => {});
      this.playerInitialized = false;
    }
    this.pendingVideoId = null;
    this.verseOfTheDayService.getVerseOfTheDay().subscribe({
      next: (v) => {
        this.verse = v;
        this.loading = false;
        this.error = v == null;
        const videoId = this.sermonVideoId;
        if (videoId) this.pendingVideoId = videoId;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  private async initPlayer(videoId: string) {
    try {
      await YoutubePlayer.initialize({
        playerId: PLAYER_ID,
        playerSize: { width: 640, height: 360 },
        videoId,
        fullscreen: false,
        playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0, playsinline: 1 },
        privacyEnhanced: true,
      });
      this.playerInitialized = true;
    } catch (err) {
      console.warn('VerseOfTheDayPage: YouTube player init failed', err);
      this.pendingVideoId = null;
    }
  }
}
