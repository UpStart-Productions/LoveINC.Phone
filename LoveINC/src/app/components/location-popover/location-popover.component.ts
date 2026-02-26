import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-location-popover',
  templateUrl: './location-popover.component.html',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon],
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
