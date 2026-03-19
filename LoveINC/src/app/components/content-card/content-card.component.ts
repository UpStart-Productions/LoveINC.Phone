import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';

/** Optional fragments for coloring numeric parts (e.g. budget amounts). */
export type ContentCardTextSegment = {
  text: string;
  tone?: 'positive' | 'negative';
};

@Component({
  selector: 'app-content-card',
  templateUrl: './content-card.component.html',
  styleUrls: ['./content-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonIcon],
})
export class ContentCardComponent {
  /** Small category label above title (e.g. "Guided Scripture", "Guided Prayer") */
  @Input() category?: string;

  /** Optional icon name for category line (e.g. "water-outline", "checkmark-done-outline") */
  @Input() categoryIcon?: string;

  /** Optional extra text before category (e.g. "0", "Day 5") */
  @Input() categoryExtra?: string;

  /** Main title (bold) */
  @Input() title!: string;

  /** When set, title is built from segments (e.g. colored amounts); overrides plain `title` display. */
  @Input() titleSegments?: ContentCardTextSegment[];

  /** Detail text below title (e.g. "2-5 min", "4-6 min") */
  @Input() detail?: string;

  /** When set, detail is built from segments; overrides plain `detail` display. */
  @Input() detailSegments?: ContentCardTextSegment[];

  /** Show play icon before detail when present */
  @Input() showDetailPlayIcon = true;

  /** Image URL for right-side visual. If set, icon/iconBg are ignored. */
  @Input() imageUrl?: string;

  /** Icon name for right-side when no image (e.g. "hand-left-outline") */
  @Input() iconName?: string;

  /** Background color for icon placeholder when using iconName */
  @Input() iconBackgroundColor = '#8b7355';

  /** Card clickable / tappable */
  @Input() clickable = true;

  /** Route to navigate to on click (e.g. '/tabs/goal-tracker') */
  @Input() route?: string;

  constructor(private router: Router) {}

  handleClick() {
    if (this.route && this.clickable) {
      this.router.navigateByUrl(this.route);
    }
  }
}
