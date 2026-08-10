import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { LOVE_INC_OFFICE_TEL } from '../shared/love-inc-contact.constants';

@Component({
  selector: 'app-assistance-intro',
  templateUrl: './assistance-intro.page.html',
  styleUrls: ['./assistance-intro.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    AppBackButtonComponent]})
export class AssistanceIntroPage {
  constructor(private router: Router) {}

  callConnectionCenter(): void {
    window.open(`tel:${LOVE_INC_OFFICE_TEL}`, '_self');
  }

  onGetStarted() {
    this.router.navigate(['/assistance/signup']);
  }

  onHaveQRCode() {
    this.router.navigate(['/tabs/service-unlock/scan']);
  }
}
