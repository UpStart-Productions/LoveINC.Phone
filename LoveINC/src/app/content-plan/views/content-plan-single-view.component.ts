import { Component, Input } from '@angular/core';
import { IonCard } from '@ionic/angular/standalone';
import { ContentPlanAuthorHeroComponent } from '../components/content-plan-author-hero/content-plan-author-hero.component';
import { MomentBlocksComponent } from '../components/moment-blocks/moment-blocks.component';
import type { ContentPlan } from '../content-plan.model';

@Component({
  selector: 'app-content-plan-single-view',
  standalone: true,
  imports: [IonCard, ContentPlanAuthorHeroComponent, MomentBlocksComponent],
  templateUrl: './content-plan-single-view.component.html',
})
export class ContentPlanSingleViewComponent {
  @Input({ required: true }) plan!: ContentPlan;
}
