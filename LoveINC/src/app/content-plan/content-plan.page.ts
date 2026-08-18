import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { MainTabBarService } from '../services/main-tab-bar.service';
import { SharingService } from '../services/sharing/sharing.service';
import {
  buildContentPlanPageShareHtml,
  buildContentPlanPageShareSubject,
} from './content-plan-share.util';
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
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    IonSpinner,
    IonTitle,
    AppBackButtonComponent,
    ContentPlanSingleViewComponent,
    ContentPlanMultiViewComponent,
    ContentPlanListViewComponent,
  ],
  templateUrl: './content-plan.page.html',
  styleUrl: './content-plan.page.scss',
})
export class ContentPlanPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(IonContent) private ionContent?: IonContent;

  private readonly route = inject(ActivatedRoute);
  private readonly contentPlanService = inject(ContentPlanService);
  private readonly mainTabBarService = inject(MainTabBarService);
  private readonly sharingService = inject(SharingService);
  private readonly cdr = inject(ChangeDetectorRef);

  private edgeScrollEl: HTMLElement | null = null;
  private edgeScrollListener: (() => void) | null = null;

  plan: ContentPlan | null = null;
  loading = true;
  pageIndex = 0;
  edgeHeaderScrolled = false;

  get canGoMultiPrev(): boolean {
    return this.pageIndex > 0;
  }

  get canGoMultiNext(): boolean {
    const count = this.plan?.moments.length ?? 0;
    return this.pageIndex < count - 1;
  }

  get multiPageLabel(): string {
    const total = this.plan?.moments.length ?? 0;
    if (total <= 0) {
      return '';
    }
    return `Page ${this.pageIndex + 1} of ${total}`;
  }

  get canShare(): boolean {
    return !this.loading && !!this.plan;
  }

  /** Standard header when there is no cover photo, or multi-page pages after the intro. */
  get showPlanHeader(): boolean {
    if (this.loading) return true;
    if (!this.plan?.coverPhotoUrl?.trim()) return true;
    return this.plan.displayStyle === 'MULTI_PAGE' && this.pageIndex > 0;
  }

  /** Moment title shown in the dark header bar on multi-page pages after the intro. */
  get planHeaderTitle(): string | null {
    if (!this.plan || this.plan.displayStyle !== 'MULTI_PAGE' || this.pageIndex <= 0) {
      return null;
    }
    return this.plan.moments[this.pageIndex]?.title ?? null;
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
        this.syncMainTabBar();
        void this.syncEdgeHeaderScrollListener();
      },
      error: () => {
        this.plan = null;
        this.pageIndex = 0;
        this.loading = false;
        this.syncMainTabBar();
        void this.syncEdgeHeaderScrollListener();
      },
    });
  }

  ionViewWillEnter(): void {
    this.syncMainTabBar();
  }

  ionViewWillLeave(): void {
    this.mainTabBarService.setForceHidden(false);
  }

  ngAfterViewInit(): void {
    void this.syncEdgeHeaderScrollListener();
  }

  ngOnDestroy(): void {
    this.teardownEdgeHeaderScrollListener();
    this.mainTabBarService.setForceHidden(false);
  }

  goMultiPrev(): void {
    if (!this.canGoMultiPrev) return;
    this.pageIndex -= 1;
    void this.resetScrollAndEdgeHeader();
  }

  goMultiNext(): void {
    if (!this.canGoMultiNext) return;
    this.pageIndex += 1;
    void this.resetScrollAndEdgeHeader();
  }

  async onShareClick(): Promise<void> {
    if (!this.plan) return;

    await this.sharingService.shareContent({
      title: this.plan.title,
      subject: buildContentPlanPageShareSubject(this.plan, this.pageIndex),
      htmlContent: buildContentPlanPageShareHtml(this.plan, this.pageIndex),
    });
  }

  private syncMainTabBar(): void {
    const hide = !this.loading && this.plan?.displayStyle === 'MULTI_PAGE';
    this.mainTabBarService.setForceHidden(hide);
  }

  /** Fade header chrome in on scroll (NephoPhone transparent-header pattern). */
  private async syncEdgeHeaderScrollListener(): Promise<void> {
    this.teardownEdgeHeaderScrollListener();

    if (!this.showEdgeHero || !this.ionContent) {
      this.edgeHeaderScrolled = false;
      this.cdr.markForCheck();
      return;
    }

    const scrollEl = await this.ionContent.getScrollElement();
    const onScroll = (): void => {
      const scrolled = scrollEl.scrollTop > 5;
      if (this.edgeHeaderScrolled === scrolled) {
        return;
      }
      this.edgeHeaderScrolled = scrolled;
      this.cdr.markForCheck();
    };

    this.edgeScrollEl = scrollEl;
    this.edgeScrollListener = onScroll;
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  private teardownEdgeHeaderScrollListener(): void {
    if (this.edgeScrollEl && this.edgeScrollListener) {
      this.edgeScrollEl.removeEventListener('scroll', this.edgeScrollListener);
    }
    this.edgeScrollEl = null;
    this.edgeScrollListener = null;
  }

  private async resetScrollAndEdgeHeader(): Promise<void> {
    this.edgeHeaderScrolled = false;
    this.cdr.markForCheck();
    await this.ionContent?.scrollToTop(0);
    void this.syncEdgeHeaderScrollListener();
  }
}
