import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonIcon, NavController } from '@ionic/angular/standalone';
import { navigateAppBack } from '../../shared/utils/navigation-back.util';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    <ion-button (click)="goBack()" fill="clear" aria-label="Back">
      <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
    </ion-button>
  `,
})
export class AppBackButtonComponent {
  /** Used when stack pop is unavailable and no `from` / `returnUrl` query param is present. */
  @Input() fallback = '/tabs/home';

  private readonly navController = inject(NavController);
  private readonly route = inject(ActivatedRoute);

  goBack(): void {
    void navigateAppBack(this.navController, this.route.snapshot, this.fallback);
  }
}
