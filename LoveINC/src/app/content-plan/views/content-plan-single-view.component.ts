import { Component, Input } from '@angular/core';
import { IonCard, IonIcon } from '@ionic/angular/standalone';
import { MomentBlocksComponent } from '../components/moment-blocks/moment-blocks.component';
import type { ContentPlan } from '../content-plan.model';

@Component({
  selector: 'app-content-plan-single-view',
  standalone: true,
  imports: [IonCard, IonIcon, MomentBlocksComponent],
  templateUrl: './content-plan-single-view.component.html',
})
export class ContentPlanSingleViewComponent {
  @Input({ required: true }) plan!: ContentPlan;

  get hasPlanAuthor(): boolean {
    return !!this.plan.author.name?.trim();
  }
}
