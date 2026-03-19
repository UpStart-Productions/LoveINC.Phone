import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonTextarea,
  ModalController,
} from '@ionic/angular/standalone';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

@Component({
  selector: 'app-entry-notes-modal',
  templateUrl: './entry-notes-modal.component.html',
  styleUrls: ['./entry-notes-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonTextarea,
  ],
})
export class EntryNotesModalComponent implements OnInit, OnDestroy {
  @Input() entryName = '';
  @Input() notes = '';

  notesValue = '';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.notesValue = this.notes ?? '';
    this.enableKeyboardResize();
  }

  ngOnDestroy() {
    this.restoreKeyboardResize();
  }

  private async enableKeyboardResize() {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    } catch {
      // Keyboard plugin may not be available (e.g. web)
    }
  }

  private async restoreKeyboardResize() {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.None });
    } catch {
      // Keyboard plugin may not be available
    }
  }

  done() {
    const trimmed = this.notesValue.trim();
    if (trimmed) {
      this.modalCtrl.dismiss(trimmed, 'save');
    } else {
      this.modalCtrl.dismiss(null, 'cancel');
    }
  }
}
