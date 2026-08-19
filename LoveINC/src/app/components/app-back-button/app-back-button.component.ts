import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonIcon, NavController } from '@ionic/angular/standalone';
import { navigateAppBack } from '../../shared/utils/navigation-back.util';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    <ion-button
      (click)="goBack()"
      fill="clear"
      [color]="onLightBackground ? 'dark' : undefined"
      aria-label="Back"
    >
      <ion-icon
        name="arrow-back-outline"
        slot="icon-only"
        [color]="onLightBackground ? 'dark' : undefined"
      ></ion-icon>
    </ion-button>
  `,
})
export class AppBackButtonComponent {
  /** White toolbar micro-apps (Goal Tracker, Simple Budget) need a dark chevron. */
  @Input() onLightBackground = false;

  /** Used when stack pop is unavailable and no `from` / `returnUrl` query param is present. */
  @Input() fallback = '/tabs/home';

  private readonly navController = inject(NavController);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  goBack(): void {
    void navigateAppBack(this.navController, this.router, this.route.snapshot, this.fallback);
  }
}
