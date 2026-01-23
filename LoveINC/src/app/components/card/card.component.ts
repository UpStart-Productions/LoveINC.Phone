import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';

export interface CardActionIcon {
  icon: string;
  handler: (e?: Event) => void;
  show?: boolean;
  buttonClass?: string;
}

export interface CardBadge {
  icon: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonIcon,
    IonButton,
  ],
})
export class CardComponent {
  @Input() imageUrl?: string;
  @Input() badge?: CardBadge;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() actionIcons?: CardActionIcon[];
  @Input() clickable = false;

  @Output() cardClick = new EventEmitter<Event>();

  get visibleActionIcons(): CardActionIcon[] {
    if (!this.actionIcons?.length) return [];
    return this.actionIcons.filter((a) => a.show !== false);
  }

  get hasActionIcons(): boolean {
    return this.visibleActionIcons.length > 0;
  }

  onCardClick(e: Event) {
    if (this.clickable) {
      this.cardClick.emit(e);
    }
  }

  onActionClick(e: Event, action: CardActionIcon) {
    e.stopPropagation();
    action.handler?.(e);
  }
}
