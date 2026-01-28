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
import { LucideAngularModule } from 'lucide-angular';

export interface CardActionIcon {
  icon?: string;
  lucideIcon?: string;
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
    LucideAngularModule,
  ],
})
export class CardComponent {
  @Input() imageUrl?: string;
  @Input() badge?: CardBadge;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() actionIcons?: CardActionIcon[];
  @Input() clickable = false;
  @Input() showShareIcon: boolean = true;

  @Output() cardClick = new EventEmitter<Event>();
  @Output() shareClick = new EventEmitter<Event>();

  get visibleActionIcons(): CardActionIcon[] {
    const icons = this.actionIcons?.filter((a) => a.show !== false) || [];
    
    // Automatically append share icon if enabled
    if (this.showShareIcon) {
      icons.push({
        icon: 'share-outline',
        handler: (e?: Event) => {
          if (e) {
            e.stopPropagation();
          }
          this.shareClick.emit(e);
        },
        show: true,
        buttonClass: 'share-button'
      });
    }
    
    return icons;
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
