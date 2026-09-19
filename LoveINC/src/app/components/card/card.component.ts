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
  IonButton, IonPopover, IonList, IonItem, IonLabel,
} from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

export interface CardActionIcon {
  label?: string;
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
    IonButton, IonPopover, IonList, IonItem, IonLabel,
    LucideAngularModule,
    SafeHtmlPipe,
  ],
})
export class CardComponent {
  @Input() imageUrl?: string;
  /** When 'right', image shows as 80x80 square on the right (Tools/Gap Ministry style). Default 'banner' = full-width top. */
  @Input() imagePosition: 'banner' | 'right' = 'banner';
  /** Icon for right-side when imagePosition is 'right' but no imageUrl (e.g. "church-outline") */
  @Input() thumbnailPlaceholderIcon?: string;
  /** Background color for thumbnail placeholder */
  @Input() thumbnailPlaceholderColor = '#8b7355';
  @Input() badge?: CardBadge;
  @Input() title?: string;
  @Input() subtitle?: string;
  /** Place the schedule's time opposite its date. */
  @Input() inlineSchedule = false;

  get scheduleDate(): string { return this.subtitle?.split('\n')[0] ?? ''; }
  get scheduleTime(): string { return this.subtitle?.split('\n').slice(1).join(' ') ?? ''; }
  /** Short description for card body. Never use long description. */
  @Input() description?: string;
  /** Custom HTML content when description is not sufficient. Use sparingly. */
  @Input() contentHtml?: string;
  @Input() actionIcons?: CardActionIcon[];
  @Input() clickable = false;
  @Input() badgeActions = false;
  actionsOpen = false;
  actionsEvent?: Event;

  get useBadgeActions(): boolean {
    return this.badgeActions && !!this.badge && !!this.imageUrl && this.imagePosition === 'banner';
  }

  openActions(event: Event): void {
    event.stopPropagation();
    this.actionsEvent = event;
    this.actionsOpen = true;
  }

  async selectAction(event: Event, action: CardActionIcon, popover: IonPopover): Promise<void> {
    event.stopPropagation();
    await popover.dismiss();
    this.actionsOpen = false;
    action.handler?.(event);
  }
  @Input() showShareIcon: boolean = true;

  @Output() cardClick = new EventEmitter<Event>();
  @Output() shareClick = new EventEmitter<Event>();
  /** Bubbled from description / contentHtml area (e.g. tappable address inside HTML). */
  @Output() contentAreaClick = new EventEmitter<Event>();

  get visibleActionIcons(): CardActionIcon[] {
    const icons = this.actionIcons?.filter((a) => a.show !== false) || [];
    
    // Automatically append share icon if enabled
    if (this.showShareIcon) {
      icons.push({
        label: 'Share',
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

  onContentAreaClick(e: Event) {
    this.contentAreaClick.emit(e);
  }
}
