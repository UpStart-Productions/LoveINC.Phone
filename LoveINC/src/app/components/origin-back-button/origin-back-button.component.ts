import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton } from '@ionic/angular/standalone';
import { readNavigationOriginHref } from '../../shared/utils/route-utils';

@Component({
  selector: 'app-origin-back-button',
  standalone: true,
  imports: [IonBackButton],
  template: `
    <ion-back-button
      [defaultHref]="resolvedHref"
      (click)="onBackClick($event)"
    ></ion-back-button>
  `,
})
export class OriginBackButtonComponent implements OnInit {
  @Input({ required: true }) defaultHref!: string;

  resolvedHref = '';

  private forcedOrigin: string | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.forcedOrigin = readNavigationOriginHref(this.route);
    this.resolvedHref = this.forcedOrigin ?? this.defaultHref;
  }

  onBackClick(event: Event): void {
    if (!this.forcedOrigin) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    void this.router.navigateByUrl(this.forcedOrigin);
  }
}
