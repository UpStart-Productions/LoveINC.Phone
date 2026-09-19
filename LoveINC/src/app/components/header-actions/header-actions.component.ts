import { Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { NotificationsButtonComponent } from '../notifications-button/notifications-button.component';
import { DonateButtonService } from '../../services/donate-button.service';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';

@Component({
  selector: 'app-header-actions',
  standalone: true,
  imports: [IonButton, IonIcon, NotificationsButtonComponent],
  template: `
    <app-notifications-button />
    @if (donateVisibility.shouldShowDonateButton()) {
      <ion-button class="donate-header-button" aria-label="Donate" (click)="donate.openDonateActionSheet()">
        <ion-icon slot="icon-only" name="gift-outline" />
      </ion-button>
    }
  `,
})
export class HeaderActionsComponent {
  readonly donateVisibility = inject(DonateButtonService);
  readonly donate = inject(DonateActionSheetService);
}
