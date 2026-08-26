import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import { ContentCardComponent } from '../content-card/content-card.component';
import type { ContentCardListItem } from '../content-card-list/content-card-list.model';
import { ContentPlanService } from '../../content-plan/content-plan.service';
import { parseLucideIconNameFromIconSvg } from '../../content-plan/content-plan.mapper';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { mapContentPlanToCoverItem, mapContentPlanToMediaItem, mapPlansToListSlides } from './peek-carousel.mapper';
import type {
  PeekCarouselCoverItem,
  PeekCarouselListSlide,
  PeekCarouselMediaItem,
  PeekCarouselSlideClick,
  PeekCarouselVariant,
} from './peek-carousel.model';

@Component({
  selector: 'app-peek-carousel',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, IonIcon, LucideAngularModule, ContentCardComponent, SafeHtmlPipe],
  templateUrl: './peek-carousel.component.html',
  styleUrl: './peek-carousel.component.scss',
})
export class PeekCarouselComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private readonly contentPlanService = inject(ContentPlanService);

  @Input({ required: true }) variant!: PeekCarouselVariant;

  @Input() sectionTitle?: string;

  /** Inline Lucide SVG HTML shown before `sectionTitle` (GrovLink theme.iconSvg). */
  @Input() sectionTitleIconSvg?: string;

  /** Left inset for the section title (e.g. `1rem` on Home). */
  @Input() sectionTitleInset?: string;

  /** When set, slides load from plans in this theme. */
  @Input() themeId: string | null = null;

  /** When set, slides load from plans in this theme (case-insensitive name match). */
  @Input() themeName: string | null = null;

  @Input() coverItems: PeekCarouselCoverItem[] = [];
  @Input() mediaItems: PeekCarouselMediaItem[] = [];
  @Input() listSlides: PeekCarouselListSlide[] = [];
  @Input() contentCardItems: ContentCardListItem[] = [];

  /** When false, cover/media slides are not tappable. List rows keep their own click rules. */
  @Input() clickable = true;

  @Input() defaultImageColor = '#8b7355';
  @Input() defaultIconBackgroundColor = '#8b7355';

  /**
   * How much of the next slide stays visible at rest, as a fraction of the track (0–0.5).
   * Default `0.08` (~8%) is half the original ~16% peek.
   */
  @Input() peek = 0.02;

  /** Shorter slides for dense sections (e.g. home platform CTAs). */
  @Input() compact = false;

  /** Media slides at cover-card height with smaller type (platform CTAs). */
  @Input() dense = false;

  /** Auto-advance when there is more than one slide. */
  @Input() autoScroll = false;

  @Input() autoScrollIntervalMs = 5000;

  @Output() slideClick = new EventEmitter<PeekCarouselSlideClick>();

  @ViewChild('trackEl') private trackEl?: ElementRef<HTMLElement>;

  private autoScrollTimer: ReturnType<typeof setInterval> | undefined;
  private autoScrollResumeTimer: ReturnType<typeof setTimeout> | undefined;
  private autoScrollIndex = 0;
  private autoScrollPaused = false;

  themedCoverItems: PeekCarouselCoverItem[] = [];
  themedMediaItems: PeekCarouselMediaItem[] = [];
  themedListSlides: PeekCarouselListSlide[] = [];

  get displayCoverItems(): PeekCarouselCoverItem[] {
    if (this.hasThemedPlans()) {
      return this.themedCoverItems;
    }
    return this.coverItems;
  }

  get displayMediaItems(): PeekCarouselMediaItem[] {
    if (this.hasThemedPlans()) {
      return this.themedMediaItems;
    }
    return this.mediaItems;
  }

  get displayListSlides(): PeekCarouselListSlide[] {
    if (this.hasThemedPlans()) {
      return this.themedListSlides;
    }
    return this.listSlides;
  }

  get peekCssValue(): string {
    const clamped = Math.min(Math.max(this.peek, 0), 0.5);
    return `${clamped * 100}%`;
  }

  get sectionTitleLucideIcon(): string | undefined {
    return parseLucideIconNameFromIconSvg(this.sectionTitleIconSvg);
  }

  ngOnInit(): void {
    this.loadThemedPlans();
  }

  ngAfterViewInit(): void {
    this.syncAutoScroll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['themeName'] && !changes['themeName'].firstChange) ||
      (changes['themeId'] && !changes['themeId'].firstChange)
    ) {
      this.loadThemedPlans();
    }

    if (
      changes['autoScroll'] ||
      changes['autoScrollIntervalMs'] ||
      changes['coverItems'] ||
      changes['mediaItems'] ||
      changes['listSlides'] ||
      changes['contentCardItems'] ||
      changes['variant']
    ) {
      this.autoScrollIndex = 0;
      this.syncAutoScroll();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoScroll();
    this.clearAutoScrollResume();
  }

  onTrackScroll(): void {
    if (!this.autoScroll || this.getSlideCount() <= 1) {
      return;
    }
    this.pauseAutoScroll(8000);
  }

  /** Re-fetch themed plans (e.g. pull-to-refresh on Home). */
  refresh(): void {
    this.loadThemedPlans(true);
  }

  trackCoverItem(_index: number, item: PeekCarouselCoverItem): string {
    return item.id;
  }

  trackMediaItem(_index: number, item: PeekCarouselMediaItem): string {
    return item.id;
  }

  trackListSlide(_index: number, slide: PeekCarouselListSlide): string {
    return slide.id;
  }

  trackListRow(index: number, row: ContentCardListItem): string {
    return row.id ?? row.title ?? String(index);
  }

  trackContentCardItem(_index: number, item: ContentCardListItem): string {
    return item.id ?? item.title ?? String(_index);
  }

  onCoverClick(item: PeekCarouselCoverItem): void {
    if (!this.clickable) return;
    this.slideClick.emit({ variant: 'cover', item });
  }

  onMediaClick(item: PeekCarouselMediaItem): void {
    if (!this.clickable) return;
    this.slideClick.emit({ variant: 'media', item });
  }

  onListRowClick(slide: PeekCarouselListSlide, row: ContentCardListItem): void {
    if (row.route) return;
    this.slideClick.emit({ variant: 'list', slide, row });
  }

  onContentCardClick(item: ContentCardListItem): void {
    if (item.route || !this.clickable) return;
    this.slideClick.emit({ variant: 'content-card', item });
  }

  private loadThemedPlans(refresh = false): void {
    const themeId = this.themeId?.trim();
    const themeName = this.themeName?.trim();
    if (!themeId && !themeName) {
      this.themedCoverItems = [];
      this.themedMediaItems = [];
      this.themedListSlides = [];
      return;
    }

    const plans$ = themeId
      ? this.contentPlanService.getPlansByThemeId(themeId, refresh)
      : this.contentPlanService.getPlansByThemeName(themeName!, refresh);

    plans$.subscribe({
      next: (plans) => {
        this.themedCoverItems = plans
          .map((plan) => mapContentPlanToCoverItem(plan))
          .filter((item): item is PeekCarouselCoverItem => item !== null);
        this.themedMediaItems = plans.map((plan) => mapContentPlanToMediaItem(plan));
        this.themedListSlides = mapPlansToListSlides(plans);
        this.autoScrollIndex = 0;
        this.syncAutoScroll();
      },
      error: () => {
        this.themedCoverItems = [];
        this.themedMediaItems = [];
        this.themedListSlides = [];
      },
    });
  }

  private hasThemedPlans(): boolean {
    return !!(this.themeId?.trim() || this.themeName?.trim());
  }

  private getSlideCount(): number {
    switch (this.variant) {
      case 'cover':
        return this.displayCoverItems.length;
      case 'media':
        return this.displayMediaItems.length;
      case 'list':
        return this.displayListSlides.length;
      case 'content-card':
        return this.contentCardItems.length;
      default:
        return 0;
    }
  }

  private syncAutoScroll(): void {
    this.clearAutoScroll();
    if (!this.autoScroll || this.getSlideCount() <= 1 || !this.trackEl?.nativeElement) {
      return;
    }

    this.autoScrollTimer = setInterval(() => {
      if (this.autoScrollPaused) {
        return;
      }
      this.advanceAutoScroll();
    }, this.autoScrollIntervalMs);
  }

  private advanceAutoScroll(): void {
    const track = this.trackEl?.nativeElement;
    const count = this.getSlideCount();
    if (!track || count <= 1) {
      return;
    }

    this.autoScrollIndex = (this.autoScrollIndex + 1) % count;
    const slide = track.children.item(this.autoScrollIndex) as HTMLElement | null;
    if (!slide) {
      return;
    }

    // Scroll the track horizontally only — scrollIntoView also moves ion-content vertically.
    track.scrollTo({
      left: slide.offsetLeft - track.offsetLeft,
      behavior: 'smooth',
    });
  }

  private pauseAutoScroll(resumeAfterMs: number): void {
    this.autoScrollPaused = true;
    this.clearAutoScrollResume();
    this.autoScrollResumeTimer = setTimeout(() => {
      this.autoScrollPaused = false;
    }, resumeAfterMs);
  }

  private clearAutoScroll(): void {
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = undefined;
    }
  }

  private clearAutoScrollResume(): void {
    if (this.autoScrollResumeTimer) {
      clearTimeout(this.autoScrollResumeTimer);
      this.autoScrollResumeTimer = undefined;
    }
  }
}
