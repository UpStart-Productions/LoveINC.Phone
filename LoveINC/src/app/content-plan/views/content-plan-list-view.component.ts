import { Component, Input } from '@angular/core';
import { ContentCardListComponent } from '../../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../../components/content-card-list/content-card-list.model';
import { ContentPlanAuthorHeroComponent } from '../components/content-plan-author-hero/content-plan-author-hero.component';
import { resolveMomentBlockText, resolveMomentFirstPhotoUrl, resolvePlanCoverImageUrl } from '../content-plan.mapper';
import type { ContentPlan } from '../content-plan.model';

@Component({
  selector: 'app-content-plan-list-view',
  standalone: true,
  imports: [ContentPlanAuthorHeroComponent, ContentCardListComponent],
  templateUrl: './content-plan-list-view.component.html',
})
export class ContentPlanListViewComponent {
  @Input({ required: true }) plan!: ContentPlan;
  @Input() navigationFrom = 'content-plan';

  get listItems(): ContentCardListItem[] {
    const planCoverUrl = resolvePlanCoverImageUrl(this.plan);
    return this.plan.moments.map((moment) => {
      const subtitle = resolveMomentBlockText(moment, 'subtitle');
      const imageUrl = resolveMomentFirstPhotoUrl(moment) ?? planCoverUrl;
      return {
        id: moment.id,
        title: moment.title,
        detail: subtitle,
        imageUrl,
        lucideIcon: imageUrl ? undefined : 'bookmark',
        iconBackgroundColor: '#349394',
        route: `/tabs/content-plan/${this.plan.id}/moment/${moment.id}`,
        navigationFrom: this.navigationFrom,
      };
    });
  }
}
