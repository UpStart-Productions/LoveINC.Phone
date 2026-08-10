import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { resolveReturnUrlFromRouteTree } from '../../shared/utils/navigation-origin.util';

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
  /** Used when no `from` / `returnUrl` query param is present. */
  @Input() fallback = '/tabs/home';

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  goBack(): void {
    const explicit = resolveReturnUrlFromRouteTree(this.route.snapshot);
    const target = explicit ?? this.fallback;
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
