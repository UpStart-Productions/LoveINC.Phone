import { Component, Input, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AuthorBioModalService } from '../../../services/author-bio-modal.service';
import { hasMeaningfulRichText } from '../../content-plan-author.util';
import type { ContentPlanAuthor } from '../../content-plan.model';

@Component({
  selector: 'app-content-plan-author-hero',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './content-plan-author-hero.component.html',
})
export class ContentPlanAuthorHeroComponent {
  private readonly authorBioModal = inject(AuthorBioModalService);

  @Input({ required: true }) author!: ContentPlanAuthor;

  /** Smaller author label (list display style hero). */
  @Input() compact = false;

  /** When false, uses body styles (below title on pages without a cover hero). */
  @Input() inHero = true;

  get hasAuthor(): boolean {
    return !!this.author.name?.trim();
  }

  get hasBio(): boolean {
    return hasMeaningfulRichText(this.author.bio);
  }

  openAuthorBio(): void {
    void this.authorBioModal.openForPlanAuthor(this.author);
  }
}
