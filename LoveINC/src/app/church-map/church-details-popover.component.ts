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
        <ion-card-title style="font-size: 18px;">{{ church.churchName }}</ion-card-title>
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
                <a [href]="'tel:' + church.phone" style="color: var(--ion-color-primary); text-decoration: none;">{{ church.phone }}</a>
              </h3>
            </ion-label>
          </ion-item>
          
          <ion-item *ngIf="church.website">
            <ion-icon name="globe-outline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <p>Website</p>
              <h3>
                <a [href]="church.website" target="_blank" style="color: var(--ion-color-primary); text-decoration: none;">Visit Website</a>
              </h3>
            </ion-label>
          </ion-item>
        </ion-list>

        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--ion-color-light-shade);" *ngIf="church.ministries && church.ministries.length > 0">
          <h3 style="font-size: 16px; font-weight: 600; color: var(--ion-color-primary); margin: 0 0 8px 0;">Ministries</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li *ngFor="let ministry of church.ministries" style="padding: 4px 0; font-size: 13px; color: var(--ion-color-dark);">
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
      font-size: 20px;
      margin-right: 12px;
    }
    
    ion-label p {
      font-size: 11px;
      color: var(--ion-color-medium);
      margin: 0 0 2px 0;
    }
    
    ion-label h3 {
      font-size: 14px;
      color: var(--ion-color-dark);
      margin: 0;
      font-weight: 500;
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
