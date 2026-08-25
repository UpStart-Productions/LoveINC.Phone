import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import type { ContentPlanAuthor } from '../content-plan/content-plan.model';
import { hasMeaningfulRichText } from '../content-plan/content-plan-author.util';

export interface AuthorBioModalOptions {
  name: string;
  jobTitle?: string;
  notes?: string;
  photoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthorBioModalService {
  private readonly modalController = inject(ModalController);

  async open(options: AuthorBioModalOptions): Promise<void> {
    const notes = options.notes?.trim();
    if (!hasMeaningfulRichText(notes)) {
      return;
    }

    const { InstructorBioModalComponent } = await import(
      '../components/instructor-bio-modal/instructor-bio-modal.component'
    );

    const name = options.name.trim() || 'Author';
    const modal = await this.modalController.create({
      component: InstructorBioModalComponent,
      componentProps: {
        instructorName: name,
        jobTitle: (options.jobTitle ?? '').trim(),
        notes,
        photoUrl: options.photoUrl || undefined,
      },
      cssClass: 'entry-notes-modal',
      presentingElement: await this.modalController.getTop(),
      showBackdrop: true,
      backdropDismiss: true,
      breakpoints: [0, 0.5, 1],
      initialBreakpoint: 0.55,
    });

    await modal.present();
  }

  openForPlanAuthor(author: ContentPlanAuthor): Promise<void> {
    return this.open({
      name: author.name,
      jobTitle: author.title,
      notes: author.bio,
      photoUrl: author.avatarUrl,
    });
  }
}
