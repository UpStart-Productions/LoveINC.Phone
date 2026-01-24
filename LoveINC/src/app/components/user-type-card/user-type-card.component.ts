import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonIcon,
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
  ],
})
export class UserTypeCardComponent {
  @Input() userType!: UserType;

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
}
