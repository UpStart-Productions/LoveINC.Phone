import { Component, Input, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner, IonContent } from '@ionic/angular/standalone';
import { ScriptureVerseService } from '../../services/scripture-verse.service';

@Component({
  selector: 'app-scripture-verse-modal',
  templateUrl: './scripture-verse-modal.component.html',
  styleUrls: ['./scripture-verse-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonSpinner, IonContent],
})
export class ScriptureVerseModalComponent implements AfterViewInit {
  @Input() reference = '';

  loading = true;
  verseText: string | null = null;
  displayReference = '';
  failed = false;

  constructor(
    private scriptureVerse: ScriptureVerseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => void this.loadVerse(), 0);
  }

  private async loadVerse(): Promise<void> {
    this.displayReference = this.reference;
    const verse = await this.scriptureVerse.getVerse(this.reference);
    if (verse) {
      this.verseText = verse.text;
      this.displayReference = verse.reference;
    } else {
      this.failed = true;
    }
    this.loading = false;
    this.cdr.markForCheck();
  }
}
