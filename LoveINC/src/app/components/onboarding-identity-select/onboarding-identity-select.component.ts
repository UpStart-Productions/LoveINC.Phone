import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { OnboardingService } from '../../services/onboarding.service';

const ONBOARDING_OPTION_LABELS: Record<string, string> = {
  'get-help': 'Client',
  volunteer: 'Volunteer',
  give: 'Donor',
  exploring: 'Just exploring',
};

/** Reusable onboarding role checkboxes (Get Help, Volunteer, Give, Just exploring) — same rules as developer tools. */
@Component({
  selector: 'app-onboarding-identity-select',
  templateUrl: './onboarding-identity-select.component.html',
  styleUrls: ['./onboarding-identity-select.component.scss'],
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
  ],
})
export class OnboardingIdentitySelectComponent implements OnInit {
  @Input() variant: 'profile' | 'developer' = 'profile';

  onboardingCompleted = false;
  onboardingSelectionLabels: string[] = [];

  devGetHelp = false;
  devVolunteer = false;
  devGive = false;
  devExploring = false;

  constructor(private onboardingService: OnboardingService) {}

  ngOnInit(): void {
    this.refresh();
  }

  /** Call when the host page re-enters (e.g. Profile) so checkboxes match storage. */
  refresh(): void {
    this.onboardingCompleted = this.onboardingService.hasCompletedOnboarding();
    const ids = this.onboardingService.getSelectedOptions();
    this.onboardingSelectionLabels = ids.map((id) => this.onboardingOptionLabel(id));
    this.syncDevOnboardingCheckboxes(ids);
  }

  get introText(): string {
    return 'Change stored onboarding roles without running the onboarding flow. Get Help and Volunteer cannot both be selected.';
  }

  private syncDevOnboardingCheckboxes(ids: string[]): void {
    const s = new Set(ids);
    this.devGetHelp = s.has('get-help');
    this.devVolunteer = s.has('volunteer');
    this.devGive = s.has('give');
    this.devExploring = s.has('exploring');
  }

  private applyDevOnboardingSelections(next: Set<string>): void {
    this.onboardingService.updateOnboardingData({ selectedOptions: Array.from(next) });
    this.refresh();
  }

  onDevGetHelpChange(event: CustomEvent): void {
    const checked = !!event.detail?.checked;
    const next = new Set(this.onboardingService.getSelectedOptions());
    if (checked) {
      next.delete('volunteer');
      next.add('get-help');
      next.delete('exploring');
    } else {
      next.delete('get-help');
    }
    this.applyDevOnboardingSelections(next);
  }

  onDevVolunteerChange(event: CustomEvent): void {
    const checked = !!event.detail?.checked;
    const next = new Set(this.onboardingService.getSelectedOptions());
    if (checked) {
      next.delete('get-help');
      next.add('volunteer');
      next.delete('exploring');
    } else {
      next.delete('volunteer');
    }
    this.applyDevOnboardingSelections(next);
  }

  onDevGiveChange(event: CustomEvent): void {
    const checked = !!event.detail?.checked;
    const next = new Set(this.onboardingService.getSelectedOptions());
    if (checked) {
      next.add('give');
      next.delete('exploring');
    } else {
      next.delete('give');
    }
    this.applyDevOnboardingSelections(next);
  }

  onDevExploringChange(event: CustomEvent): void {
    const checked = !!event.detail?.checked;
    if (checked) {
      this.applyDevOnboardingSelections(new Set(['exploring']));
    } else {
      const next = new Set(this.onboardingService.getSelectedOptions());
      next.delete('exploring');
      this.applyDevOnboardingSelections(next);
    }
  }

  private onboardingOptionLabel(id: string): string {
    if (ONBOARDING_OPTION_LABELS[id]) {
      return ONBOARDING_OPTION_LABELS[id];
    }
    return id
      .split('-')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');
  }
}
