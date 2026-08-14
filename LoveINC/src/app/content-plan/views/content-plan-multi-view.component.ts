import { Component, Input } from '@angular/core';
import { IonCard } from '@ionic/angular/standalone';
import { MomentBlocksComponent } from '../components/moment-blocks/moment-blocks.component';
import type { ContentPlan, ContentPlanMoment } from '../content-plan.model';

@Component({
  selector: 'app-content-plan-multi-view',
  standalone: true,
  imports: [IonCard, MomentBlocksComponent],
  templateUrl: './content-plan-multi-view.component.html',
})
export class ContentPlanMultiViewComponent {
  @Input({ required: true }) plan!: ContentPlan;
  @Input() pageIndex = 0;

  get activeMoment(): ContentPlanMoment | null {
    return this.plan.moments[this.pageIndex] ?? null;
  }
}
