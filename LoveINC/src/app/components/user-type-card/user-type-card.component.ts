import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonButton,
  IonProgressBar,
} from '@ionic/angular/standalone';

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
    IonCard,
    IonCardContent,
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

  constructor(private router: Router) {}

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

  get clientMessage(): string {
    return `${this.servicesCount} services available today. Get help here.`;
  }

  get volunteerMessage(): string {
    return `${this.volunteerOpportunitiesCount} volunteer opportunities you can join now.`;
  }

  get donorMessage(): string {
    return 'Winter Coat Drive';
  }

  get donorProgress(): number {
    // 45/50 coats = 0.9 or 90%
    return 45 / 50;
  }

  get donorStats(): string {
    return '45/50 coats collected • $450/$500 raised';
  }

  get displayMessage(): string {
    switch (this.userType) {
      case 'get-help':
        return this.clientMessage;
      case 'volunteer':
        return this.volunteerMessage;
      case 'give':
        return this.donorMessage;
      default:
        return '';
    }
  }

  get showProgressBar(): boolean {
    return this.userType === 'give';
  }

  onCardClick() {
    if (this.userType === 'get-help') {
      this.router.navigate(['/tabs/services']);
    } else {
      this.cardClick.emit();
    }
  }

  get isClickable(): boolean {
    return this.userType === 'get-help';
  }
}
