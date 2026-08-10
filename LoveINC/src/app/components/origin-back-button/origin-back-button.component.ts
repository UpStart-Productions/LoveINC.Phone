import { Component, Input, inject } from '@angular/core';
import { IonBackButton } from '@ionic/angular/standalone';
import { NavigationReturnService } from '../../services/navigation-return.service';

@Component({
  selector: 'app-origin-back-button',
  standalone: true,
  imports: [IonBackButton],
  template: `
    <ion-back-button
      [defaultHref]="resolvedHref"
      (click.capture)="onBackClick($event)"
    ></ion-back-button>
  `,
})
export class OriginBackButtonComponent {
  @Input({ required: true }) defaultHref!: string;

  private readonly navigationReturn = inject(NavigationReturnService);

  get resolvedHref(): string {
    return this.navigationReturn.resolveBackHref(this.defaultHref);
  }

  onBackClick(event: Event): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.navigationReturn.goBack(this.defaultHref);
  }
}
