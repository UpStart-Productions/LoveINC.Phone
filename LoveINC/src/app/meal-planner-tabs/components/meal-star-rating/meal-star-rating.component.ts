import { Component, HostBinding, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

const STAR_COLOR_LOW = { r: 253, g: 224, b: 208 };
const STAR_COLOR_HIGH = { r: 254, g: 89, b: 30 };

@Component({
  selector: 'app-meal-star-rating',
  templateUrl: './meal-star-rating.component.html',
  styleUrls: ['./meal-star-rating.component.scss'],
  standalone: true,
  imports: [IonIcon],
})
export class MealStarRatingComponent {
  @Input({ required: true }) rating!: number;
  @Input() compact = false;

  @HostBinding('class.meal-star-rating--compact')
  get isCompact(): boolean {
    return this.compact;
  }

  get formattedRating(): string {
    return this.rating.toFixed(1);
  }

  get starColor(): string {
    const t = Math.min(1, Math.max(0, (this.rating - 1) / 4));
    const r = Math.round(STAR_COLOR_LOW.r + (STAR_COLOR_HIGH.r - STAR_COLOR_LOW.r) * t);
    const g = Math.round(STAR_COLOR_LOW.g + (STAR_COLOR_HIGH.g - STAR_COLOR_LOW.g) * t);
    const b = Math.round(STAR_COLOR_LOW.b + (STAR_COLOR_HIGH.b - STAR_COLOR_LOW.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
