import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  IonIcon,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { CardComponent, CardActionIcon } from '../../components/card/card.component';
import { DonateButtonService } from '../../services/donate-button.service';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { SharingService } from '../../services/sharing/sharing.service';
import { NotificationsButtonComponent } from '../../components/notifications-button/notifications-button.component';
import { PlatformApiService } from '../../services/platform';
import type { PlatformService, PlatformOffering, PlatformAddress } from '../../services/platform/types';
import { ServiceUnlockService } from '@upstart-productions/service-unlock';
import { AppUserDataService } from '../../services/app-user-data.service';
import { UserProfileService } from '../../services/user-profile.service';
import { OnboardingService } from '../../services/onboarding.service';
import { DeviceIdService } from '../../services/device-id.service';
import { ToastController } from '@ionic/angular/standalone';
import { ActionSheetController } from '@ionic/angular/standalone';
import { VolunteerActionSheetService } from '../../services/volunteer-action-sheet.service';
import { ScheduleFormattingService } from '../../services/schedule-formatting.service';
import { CalendarService } from '../../services/calendar/calendar.service';

export interface GapServiceVoucher {
  id: string;
  title: string;
}

export interface GapService {
  id: string;
  service: string;
  schedule: string;
  daysTimes: string;
  church: string;
  address: string | null;
  contact: string;
  contactMethod: string;
  notes: string | null;
  phone?: string;
  email?: string;
  photoUrl?: string;
  /** True when this service/offering has vouchers. Used for voucher icon visibility. */
  voucherRequired?: boolean;
  /** Service id (for standalone) or parent service id (for offering). Used when navigating to voucher flow. */
  serviceId?: string;
  /** Vouchers available for this service/offering. */
  vouchers?: GapServiceVoucher[];
  /** Volunteer positions for this service/offering. */
  volunteerPositions?: Array<{ id: string; title?: string; shortDescription?: string; longDescription?: string; description?: string; schedule?: string }>;
}

@Component({
  selector: 'app-gap-ministries',
  templateUrl: 'gap-ministries.page.html',
  styleUrls: ['gap-ministries.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
    IonItem,
    IonLabel,
    CardComponent,
    NotificationsButtonComponent,
  ],
  providers: [AlertController, ActionSheetController, ToastController]
})
export class GapMinistriesPage implements OnInit {
  services: GapService[] = [];
  groupedServices: { [key: string]: GapService[] } = {};
  /** Org-level: when true, user must complete intake before accessing voucher-gated services. Default true until API responds (conservative: hide voucher icons until we know). */
  intakeRequired = true;
  scheduleOrder = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
    'By Appointment',
  ];
  fromServices: boolean = false;
  showDonateButton: boolean = false;

  constructor(
    private platformApi: PlatformApiService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private modalController: ModalController,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService,
    private serviceUnlock: ServiceUnlockService,
    private appUserData: AppUserDataService,
    private userProfile: UserProfileService,
    private onboarding: OnboardingService,
    private deviceId: DeviceIdService,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private volunteerActionSheetService: VolunteerActionSheetService,
    private scheduleFormatting: ScheduleFormattingService,
    private calendarService: CalendarService
  ) {}

  async ngOnInit() {
    await this.serviceUnlock.ensureInitialized();
    this.loadClientAccess();
    this.loadServices();
    const fromParam = this.route.snapshot.queryParamMap.get('from');
    this.fromServices = fromParam === 'services';
    this.route.queryParamMap.subscribe((params) => {
      this.fromServices = params.get('from') === 'services';
    });
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  loadClientAccess() {
    this.platformApi.getClientAccess().subscribe({
      next: (res) => {
        this.intakeRequired = res?.intakeRequired ?? false;
      },
      error: (err) => {
        console.error('Error loading client access:', err);
      },
    });
  }

  loadServices() {
    this.platformApi.getServices().subscribe({
      next: (platformServices) => {
        const all = platformServices ?? [];
        const gapServices = all.filter((s) => s.slug === 'gap-ministries');
        const toShow = gapServices.length > 0 ? gapServices : all;
        this.services = this.mapPlatformServicesToGapServices(toShow);
        this.groupServicesBySchedule();
      },
      error: (err) => {
        console.error('Error loading gap services:', err);
      },
    });
  }

  private mapPlatformServicesToGapServices(platformServices: PlatformService[]): GapService[] {
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const result: GapService[] = [];
    for (const svc of platformServices) {
      if (svc.offerings?.length) {
        for (const off of svc.offerings) {
          const { schedule, daysTimes } = this.deriveScheduleFromOffering(off, DAY_NAMES);
          const address = this.formatAddress(off.address);
          const contact = off.provider?.phone ?? off.provider?.email ?? 'Contact Love INC';
          const contactMethod = off.provider?.phone ? 'direct' : off.provider?.email ? 'direct' : 'call_loveinc';
          const itemTitle = off.items?.length ? off.items.join(', ') : svc.title;
          const rawPhoto = off.photoUrl ?? svc.photoUrl;
          const photoUrl = rawPhoto ? this.platformApi.resolveUploadUrl(rawPhoto) || rawPhoto : undefined;
          const rawPositions = (off.volunteerPositions ?? (off as unknown as Record<string, unknown>)['volunteer_positions'] ?? []) as Array<Record<string, unknown>>;
          const volunteerPositions = rawPositions.length
            ? rawPositions.map((p) => ({
                id: (p['id'] ?? p['title'] ?? off.id) as string,
                title: (p['title'] ?? p['shortDescription'] ?? p['short_description']) as string | undefined,
                shortDescription: (p['shortDescription'] ?? p['short_description']) as string | undefined,
                longDescription: (p['longDescription'] ?? p['long_description']) as string | undefined,
                description: (p['longDescription'] ?? p['long_description']) as string | undefined,
                schedule: this.scheduleFormatting.getPositionSchedule(p),
              }))
            : undefined;
          result.push({
            id: off.id,
            service: itemTitle,
            schedule,
            daysTimes,
            church: off.provider?.name ?? '',
            address,
            contact,
            contactMethod,
            notes: off.shortDescription ?? off.longDescription ?? svc.shortDescription ?? null,
            phone: off.provider?.phone,
            email: off.provider?.email,
            photoUrl,
            voucherRequired: off.voucherRequired ?? false,
            serviceId: svc.id,
            vouchers: (off.vouchers ?? []).map((v) => ({ id: v.id, title: v.title })),
            volunteerPositions,
          });
        }
      } else {
        const rawPositions = (svc.volunteerPositions ?? (svc as unknown as Record<string, unknown>)['volunteer_positions'] ?? []) as Array<Record<string, unknown>>;
        const volunteerPositions = rawPositions.length
          ? rawPositions.map((p) => ({
              id: (p['id'] ?? p['title'] ?? svc.id) as string,
              title: (p['title'] ?? p['shortDescription'] ?? p['short_description']) as string | undefined,
              shortDescription: (p['shortDescription'] ?? p['short_description']) as string | undefined,
              longDescription: (p['longDescription'] ?? p['long_description']) as string | undefined,
              description: (p['longDescription'] ?? p['long_description']) as string | undefined,
              schedule: this.scheduleFormatting.getPositionSchedule(p),
            }))
          : undefined;
        result.push({
          id: svc.id,
          service: svc.title,
          schedule: 'By Appointment',
          daysTimes: 'By appointment',
          church: '',
          address: null,
          contact: 'Contact Love INC',
          contactMethod: 'call_loveinc',
          notes: svc.shortDescription ?? null,
          voucherRequired: svc.voucherRequired ?? false,
          serviceId: svc.id,
          vouchers: (svc.vouchers ?? []).map((v) => ({ id: v.id, title: v.title })),
          volunteerPositions,
        });
      }
    }
    return result;
  }

  private deriveScheduleFromOffering(
    off: PlatformOffering,
    dayNames: string[]
  ): { schedule: string; daysTimes: string } {
    const rule = off.scheduleRule;
    const sessions = off.sessions?.filter((s) => !s.isCancelled) ?? [];
    const firstSession = sessions[0];
    if (firstSession) {
      const start = new Date(firstSession.startDate);
      const dayName = dayNames[start.getDay()];
      const time =
        this.formatSessionTime(firstSession.startDate) +
        (firstSession.endDate
          ? ` – ${this.formatSessionTime(firstSession.endDate)}`
          : '');
      return { schedule: dayName ?? 'By Appointment', daysTimes: time };
    }
    if (rule?.ruleType === 'by_appointment') {
      return { schedule: 'By Appointment', daysTimes: 'By appointment' };
    }
    if (rule?.daysOfWeek?.length) {
      const names = rule.daysOfWeek.map((d) => dayNames[d] ?? '').filter(Boolean);
      const schedule = names.length === 1 ? names[0] : names.length > 1 ? names.join(', ') : 'By Appointment';
      const start12 = rule.startTime ? this.formatTime24To12(rule.startTime) : '';
      const end12 = rule.endTime ? this.formatTime24To12(rule.endTime) : '';
      const time = [start12, end12].filter(Boolean).join(' – ') || '';
      return { schedule, daysTimes: time || 'See schedule' };
    }
    return { schedule: 'By Appointment', daysTimes: 'By appointment' };
  }

  /** Format session date string as 12hr time. Uses UTC components when API stores local times as UTC. */
  private formatSessionTime(isoDate: string): string {
    const d = new Date(isoDate);
    const isUtc = /Z$|[\+\-]\d{2}:?\d{2}$/.test(isoDate.trim());
    const h = isUtc ? d.getUTCHours() : d.getHours();
    const m = isUtc ? d.getUTCMinutes() : d.getMinutes();
    const period = h >= 12 ? 'pm' : 'am';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const min = m.toString().padStart(2, '0');
    return `${hour12}:${min}${period}`;
  }

  private formatTime24To12(time24: string): string {
    const match = time24.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return time24;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const period = h >= 12 ? 'pm' : 'am';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h}:${m}${period}`;
  }

  private formatAddress(addr: PlatformAddress | undefined): string | null {
    if (!addr) return null;
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.length ? parts.join(', ') : addr.locationName ?? null;
  }

  groupServicesBySchedule() {
    this.groupedServices = {};
    this.services.forEach(service => {
      const days = this.getDaysFromSchedule(service.schedule);
      days.forEach(day => {
        if (!this.groupedServices[day]) {
          this.groupedServices[day] = [];
        }
        this.groupedServices[day].push(service);
      });
    });
  }

  /** Expand schedule string to the day keys it should appear under. Multi-day items show under each day. */
  private getDaysFromSchedule(schedule: string): string[] {
    if (schedule === 'By Appointment') return ['By Appointment'];
    if (schedule === 'Open Weekdays') {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    }
    return schedule.split(/,\s*/).map((s) => s.trim()).filter(Boolean);
  }


  getServiceDescription(service: GapService): string {
    const esc = (s: string | null | undefined) =>
      (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<p class="app-body">${esc(service.church)}</p>` +
      (service.address ? `<p class="app-body-secondary">${esc(service.address)}</p>` : '');
  }

  /** Show voucher icon when: (org requires intake AND user completed) OR (org doesn't require intake). */
  private get showVoucherIcon(): boolean {
    const intakeCompleted =
      this.appUserData.hasIntakeCompleted() || this.serviceUnlock.isUnlocked;
    return !this.intakeRequired || intakeCompleted;
  }

  getActionIcons(service: GapService): CardActionIcon[] {
    const showVoucher =
      !!service.voucherRequired && this.showVoucherIcon;
    const icons: CardActionIcon[] = [
      { icon: 'location-outline', handler: () => this.onMapPinClick(service), show: !!service.address, buttonClass: 'map-button' },
      { icon: 'call-outline', handler: () => this.onPhoneClick(service), show: true, buttonClass: 'phone-button' },
      { icon: 'ticket-outline', handler: () => this.onVoucherClick(service), show: showVoucher, buttonClass: 'voucher-button' },
      { lucideIcon: 'heart-handshake', handler: () => this.onVolunteerClick(service), show: !!service.volunteerPositions?.length, buttonClass: 'volunteer-button' },
      { icon: 'calendar-outline', handler: () => this.onCalendarClick(service), show: true, buttonClass: 'calendar-button' },
    ];
    return icons;
  }

  async onVoucherClick(service: GapService): Promise<void> {
    const vouchers = service.vouchers ?? [];
    if (vouchers.length === 0) return;
    let voucher: GapServiceVoucher;
    if (vouchers.length === 1) {
      voucher = vouchers[0];
    } else {
      const chosen = await new Promise<GapServiceVoucher | null>((resolve) => {
        const buttons: Array<{ text: string; role?: string; handler?: () => void }> = vouchers.map((v) => ({
          text: v.title,
          handler: () => resolve(v),
        }));
        buttons.push({ text: 'Cancel', role: 'cancel', handler: () => resolve(null) });
        this.actionSheetController
          .create({ header: 'Select voucher', buttons })
          .then((sheet) => {
            sheet.present();
            sheet.onDidDismiss().then((ev) => {
              if (ev.role === 'cancel') resolve(null);
            });
          });
      });
      if (!chosen) return;
      voucher = chosen;
    }
    const alert = await this.alertController.create({
      header: voucher.title,
      message: 'Are you sure you want to request this voucher?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Request',
          handler: async () => {
            try {
              const profile = this.userProfile.getProfile();
              const onboardingData = this.onboarding.getOnboardingData();
              await this.platformApi.postVoucherRequest({
                voucherId: voucher.id,
                email: profile.email || onboardingData?.email || undefined,
                firstName: profile.firstName || onboardingData?.firstName || undefined,
                lastName: profile.lastName || onboardingData?.lastName || undefined,
                deviceId: this.deviceId.getDeviceId(),
              });
              const toast = await this.toastController.create({
                message: 'Voucher has been requested',
                duration: 3000,
                color: 'success',
              });
              await toast.present();
            } catch (err) {
              const toast = await this.toastController.create({
                message: (err as Error)?.message ?? 'Failed to request voucher',
                duration: 3000,
                color: 'danger',
              });
              await toast.present();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async onMapPinClick(service: GapService) {
    if (!service.address) return;
    const { DonationLocationMapModalComponent } = await import(
      '../../components/donation-location-map-modal/donation-location-map-modal.component'
    );
    const modal = await this.modalController.create({
      component: DonationLocationMapModalComponent,
      componentProps: {
        organization: service.service,
        address: service.address,
        hours: service.daysTimes ?? null,
        acceptedItems: service.church ? [service.church] : [],
        itemsIcon: 'business-outline',
      },
      cssClass: 'donation-map-modal-fullscreen',
    });
    await modal.present();
  }

  async onPhoneClick(service: GapService) {
    const canContact = this.serviceUnlock.canContactProvider();
    if (service.phone && canContact) {
      window.open(`tel:${service.phone}`, '_self');
    } else if (service.phone && !canContact) {
      const alert = await this.alertController.create({
        header: 'Intake Required',
        message: 'Complete intake to contact providers directly. Go to Profile to scan your intake QR code.',
        buttons: [
          { text: 'Contact Love INC', handler: () => { window.open('tel:5035373999', '_self'); } },
          { text: 'OK' },
        ],
      });
      await alert.present();
    } else {
      const alert = await this.alertController.create({
        header: 'Phone',
        message: `Call ${service.church || service.service}`,
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  async onVolunteerClick(service: GapService) {
    if (!service.volunteerPositions?.length) {
      const toast = await this.toastController.create({
        message: `No volunteer opportunities for ${service.service}`,
        duration: 3000,
        color: 'secondary',
      });
      await toast.present();
      return;
    }
    await this.volunteerActionSheetService.openVolunteerActionSheet({
      organizationName: service.service,
      address: service.address,
      positions: service.volunteerPositions,
      scheduleFallback: service.daysTimes ?? undefined,
    });
  }

  async onCalendarClick(service: GapService) {
    const parts: string[] = [];
    if (service.schedule) parts.push(`Schedule: ${service.schedule}`);
    if (service.daysTimes) parts.push(`Days/Times: ${service.daysTimes}`);
    if (service.church) parts.push(`Church: ${service.church}`);
    if (service.address) parts.push(`Address: ${service.address}`);
    const description = parts.join('\n\n') || undefined;

    await this.calendarService.addToCalendar({
      title: service.service,
      description,
      location: service.address ?? undefined,
      startDate: Date.now(),
      withPrompt: true,
    });
  }

  onCardClick(service: GapService) {
    this.router.navigate(['/tabs/content-detail', 'gap-ministry', service.id], {
      queryParams: { from: 'gap-ministries' },
    });
  }

  async onShareService(service: GapService) {
    const htmlContent = `
      <h2>${service.service}</h2>
      <p><strong>Schedule:</strong> ${service.schedule}</p>
      ${service.daysTimes ? `<p><strong>Days/Times:</strong> ${service.daysTimes}</p>` : ''}
      ${service.church ? `<p><strong>Church:</strong> ${service.church}</p>` : ''}
      ${service.address ? `<p><strong>Address:</strong> ${service.address}</p>` : ''}
      ${service.contact ? `<p><strong>Contact:</strong> ${service.contact}</p>` : ''}
      ${service.notes ? `<p>${service.notes}</p>` : ''}
    `;
    
    await this.sharingService.shareContent({
      title: service.service,
      subject: `Love INC Gap Ministry: ${service.service}`,
      htmlContent: htmlContent
    });
  }
}
