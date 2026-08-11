import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardContent, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-location-popover',
  templateUrl: './location-popover.component.html',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardContent, IonIcon],
  styles: [`
    .location-popover-card {
      margin: 0;
      max-width: 260px;
    }

    .location-popover-card ion-card-header {
      padding: 8px 10px 4px;
    }

    .location-popover-heading {
      margin: 0;
      font-weight: var(--app-font-weight-medium);
    }

    .location-popover-card ion-card-content {
      padding: 4px 10px 10px;
    }

    .location-row {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 4px;
    }

    .location-row:last-child {
      margin-bottom: 0;
    }

    .location-icon {
      font-size: var(--app-icon-size-sm);
      color: var(--ion-color-primary);
      flex-shrink: 0;
      margin-top: 5px;
    }

    .location-popover-card .location-row a.app-link {
      font-size: var(--app-font-size-xs);
    }
  `],
})
export class LocationPopoverComponent {
  /** Main heading (e.g. organization or place name). */
  @Input() title = '';
  @Input() address: string | null = null;
  /** Optional partner / contact row (tel: link). */
  @Input() phone: string | null = null;
  /** Optional external link row. */
  @Input() website: string | null = null;
  @Input() hours: string | null = null;
  /** Optional short description (e.g. organization partner summary). */
  @Input() detail: string | null = null;
  /** Optional list shown with an icon as a comma-separated line. */
  @Input() items: string[] = [];
  /** Icon name for the items row (default: gift-outline). */
  @Input() itemsIcon = 'gift-outline';

  websiteHref(url: string): string {
    const t = (url ?? '').trim();
    if (!t) return '';
    if (/^https?:\/\//i.test(t)) return t;
    return `https://${t}`;
  }
}
