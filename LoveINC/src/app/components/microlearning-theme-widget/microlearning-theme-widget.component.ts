import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentPlanService } from '../../content-plan/content-plan.service';
import type { ContentPlanTheme } from '../../content-plan/content-plan.model';
import { mapThemeDisplayToPeekVariant } from '../../content-plan/theme-display.util';
import { PeekCarouselComponent } from '../peek-carousel/peek-carousel.component';
import type {
  PeekCarouselSlideClick,
  PeekCarouselVariant,
} from '../peek-carousel/peek-carousel.model';

/** Theme-scoped microlearning widget — layout comes from the theme display style. */
@Component({
  selector: 'app-microlearning-theme-widget',
  standalone: true,
  imports: [CommonModule, PeekCarouselComponent],
  templateUrl: './microlearning-theme-widget.component.html',
})
export class MicrolearningThemeWidgetComponent implements OnInit, OnChanges {
  private readonly contentPlanService = inject(ContentPlanService);

  /** Load by theme name (case-insensitive). */
  @Input() themeName: string | null = null;

  /** Load by theme id — takes precedence over themeName when both are set. */
  @Input() themeId: string | null = null;

  /** Optional heading override; defaults to the loaded theme name. */
  @Input() heading: string | null = null;

  /** Left inset for the section title row (e.g. `1rem` on Home). */
  @Input() sectionTitleInset?: string;

  /** Inline Lucide SVG HTML for the section title (from Home or loaded theme). */
  @Input() sectionTitleIconSvg?: string;

  @Input() clickable = true;

  @Output() slideClick = new EventEmitter<PeekCarouselSlideClick>();

  @ViewChild(PeekCarouselComponent)
  private peekCarousel?: PeekCarouselComponent;

  theme: ContentPlanTheme | null = null;
  carouselVariant: PeekCarouselVariant = 'cover';
  loaded = false;

  get displayHeading(): string | undefined {
    const override = this.heading?.trim();
    if (override) {
      return override;
    }
    const name = this.theme?.name?.trim();
    return name || undefined;
  }

  get displaySectionTitleIconSvg(): string | undefined {
    const fromInput = this.sectionTitleIconSvg?.trim();
    if (fromInput) {
      return fromInput;
    }
    return this.theme?.iconSvg?.trim() || undefined;
  }

  ngOnInit(): void {
    this.loadTheme();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['themeName'] && !changes['themeName'].firstChange) ||
      (changes['themeId'] && !changes['themeId'].firstChange)
    ) {
      this.loadTheme();
    }
  }

  refresh(): void {
    this.loadTheme(true);
    this.peekCarousel?.refresh();
  }

  private loadTheme(refresh = false): void {
    const themeId = this.themeId?.trim();
    const themeName = this.themeName?.trim();
    const ref = { id: themeId, name: themeName };

    if (!themeId && !themeName) {
      this.theme = null;
      this.loaded = true;
      return;
    }

    const theme$ = themeId
      ? this.contentPlanService.getThemeById(themeId, refresh)
      : this.contentPlanService.getThemeByName(themeName!, refresh);

    theme$.subscribe({
      next: (theme) => {
        if (theme) {
          this.applyTheme(theme);
          this.loaded = true;
          return;
        }
        this.loadThemeFromPlans(ref, refresh);
      },
      error: () => {
        this.loadThemeFromPlans(ref, refresh);
      },
    });
  }

  private loadThemeFromPlans(
    ref: { id?: string; name?: string },
    refresh: boolean
  ): void {
    this.contentPlanService.getPlansByTheme(ref, refresh).subscribe({
      next: (plans) => {
        const nested = plans[0]?.theme;
        if (nested?.id && nested.name) {
          this.applyTheme(nested);
        } else {
          this.theme = null;
        }
        this.loaded = true;
      },
      error: () => {
        this.theme = null;
        this.loaded = true;
      },
    });
  }

  private applyTheme(theme: ContentPlanTheme): void {
    this.theme = theme;
    this.carouselVariant = mapThemeDisplayToPeekVariant(theme.displayStyle);
  }
}
