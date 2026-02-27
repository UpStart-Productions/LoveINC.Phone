import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { format, startOfDay } from 'date-fns';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { CardComponent, CardActionIcon } from '../components/card/card.component';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { SharingService } from '../services/sharing/sharing.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import {
  PlatformApiService,
  type PlatformClass,
  type PlatformEvent,
  type PlatformOffering,
} from '../services/platform';

export type UpdateItemType = 'event' | 'class';

export interface UpdateItem {
  id: string;
  type: UpdateItemType;
  photoUrl: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  startDate: string;
}

@Component({
  selector: 'app-updates',
  templateUrl: 'updates.page.html',
  styleUrls: ['updates.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    CardComponent,
    NotificationsButtonComponent,
  ],
})
export class UpdatesPage implements OnInit {
  items: UpdateItem[] = [];
  showDonateButton: boolean = false;

  constructor(
    private router: Router,
    private platformApi: PlatformApiService,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService
  ) {}

  ngOnInit() {
    this.loadItems();
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  loadItems() {
    forkJoin({
      events: this.platformApi.getEvents(),
      classes: this.platformApi.getClasses(),
    })
      .pipe(
        map(({ events, classes }) => {
          const today = startOfDay(new Date()).getTime();
          const eventItems = (events ?? [])
            .filter((e) => new Date(e.startDate).getTime() >= today)
            .map((e) => this.mapEventToUpdateItem(e));
          const classItems = (classes ?? [])
            .map((c) => ({ class: c, startDate: this.getClassStartDate(c) }))
            .filter(({ startDate }) => startDate && new Date(startDate).getTime() >= today)
            .map(({ class: c, startDate }) => this.mapClassToUpdateItem(c, startDate!));
          return [...eventItems, ...classItems].sort(
            (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        })
      )
      .subscribe({
        next: (data) => {
          this.items = data;
        },
        error: (err) => {
          console.error('Error loading updates:', err);
        },
      });
  }

  private getClassStartDate(c: PlatformClass): string | undefined {
    if (c.nextSession?.startDate) return c.nextSession.startDate;
    return this.deriveStartDateFromOfferings(c.offerings);
  }

  private deriveStartDateFromOfferings(offerings?: PlatformOffering[]): string | undefined {
    if (!offerings?.length) return undefined;
    for (const off of offerings) {
      const sessions = off.sessions?.filter((s) => !s.isCancelled) ?? [];
      const session = sessions.find((s) => s.startDate);
      if (session?.startDate) return session.startDate;
      if (off.scheduleRule?.startDate) return off.scheduleRule.startDate;
    }
    return undefined;
  }

  private mapEventToUpdateItem(e: PlatformEvent): UpdateItem {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    const dateStr = format(start, 'EEEE, MMMM d, yyyy');
    const timeStr =
      start.getTime() !== end.getTime()
        ? `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`
        : format(start, 'h:mm a');
    const subtitle = `${dateStr} • ${timeStr}`;
    return {
      id: e.id,
      type: 'event',
      photoUrl: this.platformApi.resolveUploadUrl(e.photoUrl) || e.photoUrl || '',
      title: e.title,
      subtitle,
      shortDescription: e.shortDescription ?? '',
      description: e.longDescription ?? e.shortDescription ?? '',
      startDate: e.startDate,
    };
  }

  private mapClassToUpdateItem(c: PlatformClass, startDate: string): UpdateItem {
    const session = c.nextSession ?? this.deriveSessionFromOfferings(c.offerings);
    const start = new Date(startDate);
    const dateStr = format(start, 'EEEE, MMMM d, yyyy');
    const timeStr = session?.time ? ` • ${session.time}` : '';
    const subtitle = `${dateStr}${timeStr}`;
    return {
      id: c.id,
      type: 'class',
      photoUrl: this.platformApi.resolveUploadUrl(c.photoUrl) || c.photoUrl || '',
      title: c.title,
      subtitle,
      shortDescription: c.shortDescription ?? '',
      description: c.longDescription ?? c.shortDescription ?? '',
      startDate,
    };
  }

  private deriveSessionFromOfferings(
    offerings?: PlatformOffering[]
  ): { startDate: string; endDate: string; dayOfWeek: string; time: string } | undefined {
    if (!offerings?.length) return undefined;
    const off = offerings[0];
    const sessions = off.sessions?.filter((s) => !s.isCancelled) ?? [];
    const session = sessions[0];
    const rule = off.scheduleRule;
    const startDate = session?.startDate ?? rule?.startDate;
    const endDate = session?.endDate ?? rule?.endDate;
    if (!startDate || !endDate) return undefined;
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = rule?.daysOfWeek?.length
      ? rule.daysOfWeek.map((n) => DAY_NAMES[n] ?? '').join(', ')
      : '';
    const time = [rule?.startTime, rule?.endTime].filter(Boolean).join(' – ') || '';
    return { startDate, endDate, dayOfWeek, time };
  }

  getActionIcons(item: UpdateItem): CardActionIcon[] {
    return [
      {
        icon: 'calendar-outline',
        handler: () => this.onCalendarClick(item),
        show: true,
        buttonClass: 'calendar-button',
      },
    ];
  }

  navigateToDetail(item: UpdateItem) {
    this.router.navigate(['/tabs/content-detail', item.type, item.id], {
      queryParams: { from: 'updates' },
    });
  }

  onCalendarClick(item: UpdateItem) {
    // TODO: Implement calendar functionality
    console.log('Calendar clicked for:', item.title);
  }

  async onShareItem(item: UpdateItem) {
    const htmlContent = `
      <h2>${item.title}</h2>
      ${item.subtitle ? `<p><strong>${item.subtitle}</strong></p>` : ''}
      ${item.description ? `<p>${item.description}</p>` : ''}
    `;
    await this.sharingService.shareContent({
      title: item.title,
      subject: `Love INC ${item.type === 'event' ? 'Event' : 'Class'}: ${item.title}`,
      htmlContent,
    });
  }
}
