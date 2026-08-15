import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { SharingService } from '../services/sharing/sharing.service';
import { MomentBlocksComponent } from './components/moment-blocks/moment-blocks.component';
import {
  buildContentPlanMomentShareHtml,
  buildContentPlanMomentShareSubject,
} from './content-plan-share.util';
import { ContentPlanService } from './content-plan.service';
import type { ContentPlan, ContentPlanMoment } from './content-plan.model';

@Component({
  selector: 'app-content-plan-moment-page',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
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
  private readonly sharingService = inject(SharingService);

  plan: ContentPlan | null = null;
  moment: ContentPlanMoment | null = null;
  planFallback = '/tabs/home';
  loading = true;

  get canShare(): boolean {
    return !this.loading && !!this.moment;
  }

  ngOnInit(): void {
    const planKey = this.route.snapshot.paramMap.get('planKey') ?? '';
    const momentId = this.route.snapshot.paramMap.get('momentId') ?? '';
    this.planFallback = `/tabs/content-plan/${planKey}`;

    this.contentPlanService.getMoment(planKey, momentId).subscribe({
      next: (result) => {
        this.plan = result?.plan ?? null;
        this.moment = result?.moment ?? null;
        this.loading = false;
      },
      error: () => {
        this.plan = null;
        this.moment = null;
        this.loading = false;
      },
    });
  }

  async onShareClick(): Promise<void> {
    if (!this.moment) return;

    await this.sharingService.shareContent({
      title: this.moment.title,
      subject: buildContentPlanMomentShareSubject(this.moment, this.plan),
      htmlContent: buildContentPlanMomentShareHtml(this.moment, this.plan),
    });
  }
}
