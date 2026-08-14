import { Component, Input } from '@angular/core';
import { IonCard } from '@ionic/angular/standalone';
import { MomentBlocksComponent } from '../components/moment-blocks/moment-blocks.component';
import type { ContentPlan } from '../content-plan.model';

@Component({
  selector: 'app-content-plan-single-view',
  standalone: true,
  imports: [IonCard, MomentBlocksComponent],
  templateUrl: './content-plan-single-view.component.html',
})
export class ContentPlanSingleViewComponent {
  @Input({ required: true }) plan!: ContentPlan;
}
