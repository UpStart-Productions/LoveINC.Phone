import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-updates',
  templateUrl: 'updates.page.html',
  styleUrls: ['updates.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, ExploreContainerComponent],
})
export class UpdatesPage {
  constructor(private router: Router) {
    addIcons({ personCircleOutline });
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }
}
