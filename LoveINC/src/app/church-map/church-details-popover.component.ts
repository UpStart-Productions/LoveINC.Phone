import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonList
} from '@ionic/angular/standalone';
import { PartnerChurch } from './church-map.page';

@Component({
  selector: 'app-church-details-popover',
  template: `
    <ion-card *ngIf="church" style="margin: 0; max-width: 300px;">
      <ion-card-header>
        <ion-card-title class="app-title">{{ church.churchName }}</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <ion-list lines="none">
          <ion-item>
            <ion-icon name="location-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <p>Address</p>
              <h3>{{ formatAddress(church) }}</h3>
            </ion-label>
          </ion-item>
          
          <ion-item *ngIf="church.phone">
            <ion-icon name="call-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <p>Phone</p>
              <h3>
                <a [href]="'tel:' + church.phone" class="app-link">{{ church.phone }}</a>
              </h3>
            </ion-label>
          </ion-item>
          
          <ion-item *ngIf="church.website">
            <ion-icon name="globe-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <p>Website</p>
              <h3>
                <a [href]="church.website" target="_blank" class="app-link">Visit Website</a>
              </h3>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="ministries-section" *ngIf="church.ministries && church.ministries.length > 0">
          <h3 class="ministries-title">Ministries</h3>
          <ul class="ministries-list">
            <li *ngFor="let ministry of church.ministries" class="ministry-item">
              • {{ ministry }}
            </li>
          </ul>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
      margin-bottom: 12px;
    }

    ion-item ion-icon {
      font-size: var(--app-icon-size-md);
      margin-right: 12px;
    }

    ion-label p {
      font-size: var(--app-font-size-sm);
      color: var(--ion-color-medium);
      margin: 0 0 2px 0;
    }

    ion-label h3 {
      font-size: var(--app-font-size-body);
      color: var(--ion-color-dark);
      margin: 0;
      font-weight: var(--app-font-weight-medium);
    }

    .ministries-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    .ministries-title {
      font-size: var(--app-font-size-body);
      font-weight: var(--app-font-weight-medium);
      color: var(--ion-color-primary);
      margin: 0 0 8px 0;
    }

    .ministries-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .ministry-item {
      padding: 4px 0;
      font-size: var(--app-font-size-sm);
      color: var(--ion-color-dark);
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonIcon,
    IonList
  ]
})
export class ChurchDetailsPopoverComponent {
  @Input() church!: PartnerChurch;
  @Input() formatAddress!: (church: PartnerChurch) => string;
}
