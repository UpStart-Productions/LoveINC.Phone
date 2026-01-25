import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';

export type UserType = 'get-help' | 'volunteer' | 'give';

interface UserTypeConfig {
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-user-type-card',
  templateUrl: './user-type-card.component.html',
  styleUrls: ['./user-type-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonProgressBar,
  ],
})
export class UserTypeCardComponent {
  @Input() userType!: UserType;
  @Input() servicesCount?: number = 3; // Default for client
  @Input() volunteerOpportunitiesCount?: number = 2; // Default for volunteer
  @Output() cardClick = new EventEmitter<void>();

  constructor(
    private router: Router,
    private donateActionSheetService: DonateActionSheetService
  ) {}

  private readonly userTypeConfigs: Record<UserType, UserTypeConfig> = {
    'get-help': {
      label: 'Get Help',
      icon: 'hand-right-outline',
      color: 'var(--love-inc-blue)',
    },
    'volunteer': {
      label: 'Volunteer',
      icon: 'heart-outline',
      color: 'var(--love-inc-teal)',
    },
    'give': {
      label: 'Give',
      icon: 'gift-outline',
      color: 'var(--love-inc-gold)',
    },
  };

  get config(): UserTypeConfig {
    return this.userTypeConfigs[this.userType];
  }

  get clientTitle(): string {
    return 'Support';
  }

  get clientDescription(): string {
    return `${this.servicesCount} services available today. Get help here.`;
  }

  get volunteerTitle(): string {
    return 'Volunteer';
  }

  get volunteerDescription(): string {
    return `${this.volunteerOpportunitiesCount} volunteer opportunities you can join now.`;
  }

  get donorTitle(): string {
    return 'Donate';
  }

  get donorDescription(): string {
    return 'Winter Coat Drive\r\n$450/$500 raised';
  }

  get displayTitle(): string {
    switch (this.userType) {
      case 'get-help':
        return this.clientTitle;
      case 'volunteer':
        return this.volunteerTitle;
      case 'give':
        return this.donorTitle;
      default:
        return '';
    }
  }

  get displayDescription(): string {
    switch (this.userType) {
      case 'get-help':
        return this.clientDescription;
      case 'volunteer':
        return this.volunteerDescription;
      case 'give':
        return this.donorDescription;
      default:
        return '';
    }
  }

  get donorProgress(): number {
    // 45/50 coats = 0.9 or 90%
    return 45 / 50;
  }

  get donorStats(): string {
    return '45/50 coats collected • $450/$500 raised';
  }

  get showProgressBar(): boolean {
    return this.userType === 'give';
  }

  onCardClick() {
    if (this.userType === 'get-help') {
      this.router.navigate(['/tabs/services']);
    } else if (this.userType === 'give') {
      this.donateActionSheetService.openDonateActionSheet();
    } else {
      this.cardClick.emit();
    }
  }

  get isClickable(): boolean {
    return true; // All cards are clickable now
  }

  get actionPillText(): string {
    switch (this.userType) {
      case 'get-help':
        return 'Support';
      case 'volunteer':
        return 'Join';
      case 'give':
        return 'Donate';
      default:
        return '';
    }
  }

  get actionPillColor(): string {
    return this.config.color;
  }
}
