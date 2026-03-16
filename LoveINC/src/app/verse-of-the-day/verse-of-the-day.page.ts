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
import { SharingService } from '../services/sharing/sharing.service';
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

  constructor(
    private readonly verseOfTheDayService: VerseOfTheDayService,
    private readonly sharingService: SharingService
  ) {}

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

  async onShare() {
    if (!this.verse) return;
    const v = this.verse;
    const htmlContent = `
      <h2>${v.reference}</h2>
      <p>${v.content}</p>
      ${v.verseUrl ? `<p><a href="${v.verseUrl}">Read on Bible Gateway</a></p>` : ''}
      ${v.commentaryUrl && v.commentaryTitle ? `<p><strong>Commentary:</strong> <a href="${v.commentaryUrl}">${v.commentaryTitle}</a>${v.commentaryAuthor || v.commentaryPublisher ? ` — ${[v.commentaryAuthor, v.commentaryPublisher].filter(Boolean).join(', ')}` : ''}</p>` : ''}
      ${v.sermonUrl && v.sermonTitle ? `<p><strong>Sermon:</strong> <a href="${v.sermonUrl}">${v.sermonTitle}</a>${v.sermonAuthor || v.sermonPublisher ? ` — ${[v.sermonAuthor, v.sermonPublisher].filter(Boolean).join(', ')}` : ''}</p>` : ''}
    `;
    await this.sharingService.shareContent({
      title: `Verse of the Day: ${v.reference}`,
      subject: `Verse of the Day: ${v.reference}`,
      htmlContent: htmlContent.trim(),
    });
  }
}
