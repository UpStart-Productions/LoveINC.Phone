import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { ScriptureVerseModalComponent } from '../components/scripture-verse-modal/scripture-verse-modal.component';

@Injectable({ providedIn: 'root' })
export class ScriptureVerseModalService {
  private readonly modalController = inject(ModalController);

  async open(reference: string): Promise<void> {
    const ref = reference.trim();
    if (!ref) {
      return;
    }

    try {
      const modal = await this.modalController.create({
        component: ScriptureVerseModalComponent,
        componentProps: { reference: ref },
        cssClass: 'scripture-verse-modal-sheet',
        showBackdrop: true,
        backdropDismiss: true,
        breakpoints: [0, 0.67],
        initialBreakpoint: 0.67,
        expandToScroll: false,
        handle: true,
      });
      await modal.present();
    } catch (err) {
      console.error('ScriptureVerseModalService: open failed', err);
    }
  }
}
