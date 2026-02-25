import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonIcon, IonProgressBar } from '@ionic/angular/standalone';
import type { PlatformCta, PlatformCtaType } from '../../services/platform/types';

@Component({
  selector: 'app-home-cta-row',
  templateUrl: './home-cta-row.component.html',
  styleUrls: ['./home-cta-row.component.scss'],
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonIcon, IonProgressBar],
})
export class HomeCtaRowComponent {
  @Input() cta!: PlatformCta;
  @Input() ctaContext: 'give' | 'volunteer' = 'give';

  constructor(private router: Router) {}

  get iconName(): string {
    return this.ctaContext === 'volunteer' ? 'heart-outline' : 'gift-outline';
  }

  get pillText(): string {
    return this.ctaContext === 'volunteer' ? 'Join' : 'Donate';
  }

  get accentColor(): string {
    return this.ctaContext === 'volunteer' ? 'var(--love-inc-teal)' : 'var(--love-inc-gold)';
  }

  get progressValue(): number {
    const g = this.cta?.goalValue;
    const c = this.cta?.currentValue;
    if (g == null || g <= 0 || c == null) return 0;
    return Math.min(1, c / g);
  }

  get progressText(): string {
    const g = this.cta?.goalValue;
    const c = this.cta?.currentValue;
    if (g == null || c == null) return '';
    const unit = this.cta?.unitLabel?.trim() ? ` ${this.cta.unitLabel}` : '';
    return `${c}/${g}${unit}`.trim();
  }

  get showProgressBar(): boolean {
    const g = this.cta?.goalValue;
    const c = this.cta?.currentValue;
    return g != null && g > 0 && c != null;
  }

  get contentDetailType(): string {
    const map: Record<PlatformCtaType, string> = {
      donation_drive: 'donation-drive',
      volunteer_call: 'volunteer',
      fundraiser: 'fundraiser',
      awareness: 'awareness',
    };
    return map[this.cta?.type] ?? this.cta?.type ?? 'donation-drive';
  }

  onCardClick() {
    if (!this.cta?.id) return;
    this.router.navigate(['/tabs/content-detail', this.contentDetailType, this.cta.id]);
  }
}
