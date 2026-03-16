import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-location-popover',
  templateUrl: './location-popover.component.html',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon],
  styles: [`
    .location-popover-card {
      margin: 0;
      max-width: 280px;
    }

    .location-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }

    .location-row:last-child {
      margin-bottom: 0;
    }

    .location-icon {
      font-size: var(--app-icon-size-md);
      color: var(--ion-color-primary);
      flex-shrink: 0;
    }
  `],
})
export class LocationPopoverComponent {
  /** Main heading (e.g. organization or place name). */
  @Input() title = '';
  @Input() address: string | null = null;
  @Input() hours: string | null = null;
  /** Optional list shown with an icon as a comma-separated line. */
  @Input() items: string[] = [];
  /** Icon name for the items row (default: gift-outline). */
  @Input() itemsIcon = 'gift-outline';
}
