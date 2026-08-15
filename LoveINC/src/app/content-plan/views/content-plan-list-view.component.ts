import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { ContentCardListComponent } from '../../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../../components/content-card-list/content-card-list.model';
import { resolveMomentBlockText } from '../content-plan.mapper';
import type { ContentPlan } from '../content-plan.model';

@Component({
  selector: 'app-content-plan-list-view',
  standalone: true,
  imports: [IonIcon, ContentCardListComponent],
  templateUrl: './content-plan-list-view.component.html',
})
export class ContentPlanListViewComponent {
  @Input({ required: true }) plan!: ContentPlan;
  @Input() navigationFrom = 'content-plan';

  get hasPlanAuthor(): boolean {
    return !!this.plan.author.name?.trim();
  }

  get listItems(): ContentCardListItem[] {
    return this.plan.moments.map((moment) => {
      const subtitle = resolveMomentBlockText(moment, 'subtitle');
      return {
        id: moment.id,
        title: moment.title,
        detail: subtitle,
        imageUrl: this.momentImageUrl(moment),
        lucideIcon: this.momentImageUrl(moment) ? undefined : 'bookmark',
        iconBackgroundColor: '#349394',
        route: `/tabs/content-plan/${this.plan.id}/moment/${moment.id}`,
        navigationFrom: this.navigationFrom,
      };
    });
  }

  private momentImageUrl(moment: ContentPlan['moments'][number]): string | undefined {
    const photoBlock = moment.blocks.find((block) => block.type === 'PHOTO');
    const url = photoBlock?.content['url'];
    return typeof url === 'string' && url.trim() ? url : undefined;
  }
}
