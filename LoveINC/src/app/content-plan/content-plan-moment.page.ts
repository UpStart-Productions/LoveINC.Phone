import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonSpinner,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { MomentBlocksComponent } from './components/moment-blocks/moment-blocks.component';
import { ContentPlanService } from './content-plan.service';
import type { ContentPlanMoment } from './content-plan.model';

@Component({
  selector: 'app-content-plan-moment-page',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonContent,
    IonCard,
    IonSpinner,
    AppBackButtonComponent,
    MomentBlocksComponent,
  ],
  templateUrl: './content-plan-moment.page.html',
})
export class ContentPlanMomentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contentPlanService = inject(ContentPlanService);

  moment: ContentPlanMoment | null = null;
  planFallback = '/tabs/home';
  loading = true;

  ngOnInit(): void {
    const planKey = this.route.snapshot.paramMap.get('planKey') ?? '';
    const momentId = this.route.snapshot.paramMap.get('momentId') ?? '';
    this.planFallback = `/tabs/content-plan/${planKey}`;

    this.contentPlanService.getMoment(planKey, momentId).subscribe({
      next: (result) => {
        this.moment = result?.moment ?? null;
        this.loading = false;
      },
      error: () => {
        this.moment = null;
        this.loading = false;
      },
    });
  }
}
