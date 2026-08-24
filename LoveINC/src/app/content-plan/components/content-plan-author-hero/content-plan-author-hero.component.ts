import { Component, Input, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { AuthorBioModalService } from '../../../services/author-bio-modal.service';
import type { ContentPlanAuthor } from '../../content-plan.model';

@Component({
  selector: 'app-content-plan-author-hero',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './content-plan-author-hero.component.html',
})
export class ContentPlanAuthorHeroComponent {
  private readonly authorBioModal = inject(AuthorBioModalService);

  @Input({ required: true }) author!: ContentPlanAuthor;

  /** Smaller author label (list display style hero). */
  @Input() compact = false;

  get hasAuthor(): boolean {
    return !!this.author.name?.trim();
  }

  get hasBio(): boolean {
    return !!this.author.bio?.trim();
  }

  openAuthorBio(): void {
    void this.authorBioModal.openForPlanAuthor(this.author);
  }
}
