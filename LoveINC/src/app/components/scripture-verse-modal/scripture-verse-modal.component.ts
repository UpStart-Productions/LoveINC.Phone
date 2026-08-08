import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ScriptureVerseService } from '../../services/scripture-verse.service';

@Component({
  selector: 'app-scripture-verse-modal',
  templateUrl: './scripture-verse-modal.component.html',
  styleUrls: ['./scripture-verse-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
  ],
})
export class ScriptureVerseModalComponent implements OnInit {
  @Input() reference = '';

  loading = true;
  verseText: string | null = null;
  displayReference = '';
  failed = false;

  constructor(
    private modalController: ModalController,
    private scriptureVerse: ScriptureVerseService
  ) {}

  async ngOnInit(): Promise<void> {
    this.displayReference = this.reference;
    const verse = await this.scriptureVerse.getVerse(this.reference);
    if (verse) {
      this.verseText = verse.text;
      this.displayReference = verse.reference;
    } else {
      this.failed = true;
    }
    this.loading = false;
  }

  dismiss(): void {
    void this.modalController.dismiss();
  }
}
