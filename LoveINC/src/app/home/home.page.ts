import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { OnboardingService } from '../services/onboarding.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, ExploreContainerComponent],
})
export class HomePage {
  constructor(private onboardingService: OnboardingService) {}

  // For testing - add to window for easy access in console
  ngOnInit() {
    (window as any).clearOnboarding = () => {
      this.onboardingService.clearOnboarding();
    };
  }
}
