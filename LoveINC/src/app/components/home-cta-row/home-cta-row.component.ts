import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonIcon, IonProgressBar, NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { navigateAppForward } from '../../shared/utils/navigation-forward.util';
import type { HomeCtaRowModel } from './home-cta-row.model';

@Component({
  selector: 'app-home-cta-row',
  templateUrl: './home-cta-row.component.html',
  styleUrls: ['./home-cta-row.component.scss'],
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonIcon, IonProgressBar],
})
export class HomeCtaRowComponent {
  @Input({ required: true }) row!: HomeCtaRowModel;

  private readonly router = inject(Router);
  private readonly navController = inject(NavController);
  private readonly donateActionSheetService = inject(DonateActionSheetService);

  get progressValue(): number {
    const g = this.row.progress?.goal;
    const c = this.row.progress?.current;
    if (g == null || g <= 0 || c == null) return 0;
    return Math.min(1, c / g);
  }

  get progressFigureLevel(): 'low' | 'mid' | 'high' {
    const v = this.progressValue;
    if (v < 0.3) return 'low';
    if (v <= 0.6) return 'mid';
    return 'high';
  }

  get progressBarFillColor(): string {
    switch (this.progressFigureLevel) {
      case 'low':
        return 'var(--ion-color-danger)';
      case 'mid':
        return 'var(--love-inc-gold)';
      default:
        return 'var(--ion-color-success)';
    }
  }

  get progressAmountsText(): string {
    const g = this.row.progress?.goal;
    const c = this.row.progress?.current;
    if (g == null || c == null) return '';
    return `${c}/${g}`;
  }

  get progressUnitSuffix(): string {
    const unit = this.row.progress?.unitLabel?.trim();
    return unit ? ` ${unit}` : '';
  }

  get showProgress(): boolean {
    return !!this.row.progress && this.row.progress.goal > 0;
  }

  onRowClick(): void {
    const action = this.row.action;
    switch (action.kind) {
      case 'route':
        void navigateAppForward(this.navController, this.router, action.path, {
          queryParams: action.queryParams,
        });
        break;
      case 'content-detail':
        void navigateAppForward(
          this.navController,
          this.router,
          ['/tabs/content-detail', action.contentType, action.id],
          { queryParams: { from: 'home' } }
        );
        break;
      case 'donate-sheet':
        void this.donateActionSheetService.openDonateActionSheet();
        break;
      case 'get-help':
        if (action.target === 'assistance-intro') {
          void navigateAppForward(this.navController, this.router, ['/tabs/assistance/intro']);
        } else if (action.target === 'profile') {
          void navigateAppForward(this.navController, this.router, ['/tabs/profile'], {
            queryParams: { from: 'home' },
          });
        } else if (action.target === 'gap-ministries') {
          void navigateAppForward(this.navController, this.router, ['/tabs/gap-ministries'], {
            queryParams: { from: 'home' },
          });
        } else {
          void navigateAppForward(this.navController, this.router, ['/tabs/services'], {
            queryParams: { from: 'home' },
          });
        }
        break;
    }
  }
}
