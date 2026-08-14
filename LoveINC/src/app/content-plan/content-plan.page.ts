import { Component, OnInit, inject } from '@angular/core';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentPlanService } from './content-plan.service';
import type { ContentPlan } from './content-plan.model';
import { ContentPlanSingleViewComponent } from './views/content-plan-single-view.component';
import { ContentPlanMultiViewComponent } from './views/content-plan-multi-view.component';
import { ContentPlanListViewComponent } from './views/content-plan-list-view.component';

@Component({
  selector: 'app-content-plan-page',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonContent,
    IonIcon,
    IonSpinner,
    AppBackButtonComponent,
    ContentPlanSingleViewComponent,
    ContentPlanMultiViewComponent,
    ContentPlanListViewComponent,
  ],
  templateUrl: './content-plan.page.html',
  styleUrl: './content-plan.page.scss',
})
export class ContentPlanPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contentPlanService = inject(ContentPlanService);

  plan: ContentPlan | null = null;
  loading = true;
  pageIndex = 0;

  get canGoMultiPrev(): boolean {
    return this.pageIndex > 0;
  }

  get canGoMultiNext(): boolean {
    const count = this.plan?.moments.length ?? 0;
    return this.pageIndex < count - 1;
  }

  /** Standard header when there is no cover photo, or multi-page pages after the intro. */
  get showPlanHeader(): boolean {
    if (this.loading) return true;
    if (!this.plan?.coverPhotoUrl?.trim()) return true;
    return this.plan.displayStyle === 'MULTI_PAGE' && this.pageIndex > 0;
  }

  /** Cover photo is the top chrome on intro only; back button floats over the hero. */
  get showEdgeHero(): boolean {
    if (this.loading || !this.plan?.coverPhotoUrl?.trim()) return false;
    if (this.plan.displayStyle === 'MULTI_PAGE' && this.pageIndex > 0) return false;
    return true;
  }

  ngOnInit(): void {
    const planKey = this.route.snapshot.paramMap.get('planKey') ?? '';
    this.contentPlanService.getPlan(planKey, true).subscribe({
      next: (plan) => {
        this.plan = plan;
        this.pageIndex = 0;
        this.loading = false;
      },
      error: () => {
        this.plan = null;
        this.pageIndex = 0;
        this.loading = false;
      },
    });
  }

  goMultiPrev(): void {
    if (!this.canGoMultiPrev) return;
    this.pageIndex -= 1;
  }

  goMultiNext(): void {
    if (!this.canGoMultiNext) return;
    this.pageIndex += 1;
  }
}
