import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerseOfTheDayService, VerseOfTheDay } from '../../verse-of-the-day/verse-of-the-day.service';
import { ContentCardComponent } from '../content-card/content-card.component';

@Component({
  selector: 'app-verse-of-the-day-widget',
  templateUrl: './verse-of-the-day-widget.component.html',
  styleUrls: ['./verse-of-the-day-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class VerseOfTheDayWidgetComponent implements OnInit {
  verse: VerseOfTheDay | null = null;
  loading = true;

  constructor(private verseOfTheDayService: VerseOfTheDayService) {}

  ngOnInit() {
    this.verseOfTheDayService.getVerseOfTheDay().subscribe({
      next: (v) => {
        this.verse = v;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get cardTitle(): string {
    if (this.loading) return 'Verse of the Day';
    if (this.verse) return this.verse.reference;
    return 'Verse of the Day';
  }

  get cardDetail(): string {
    if (this.loading) return 'Loading…';
    if (this.verse) return this.verse.content;
    return 'Tap to read today\'s verse';
  }
}
