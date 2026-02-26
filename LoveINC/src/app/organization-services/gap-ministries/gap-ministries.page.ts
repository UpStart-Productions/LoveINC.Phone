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
import { AlertsModalService } from '../../services/alerts-modal.service';
import { PlatformApiService } from '../../services/platform';
import type { PlatformService, PlatformOffering, PlatformAddress } from '../../services/platform/types';

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
    CardComponent
  ],
  providers: [AlertController]
})
export class GapMinistriesPage implements OnInit {
  services: GapService[] = [];
  groupedServices: { [key: string]: GapService[] } = {};
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
    private alertsModalService: AlertsModalService
  ) {}

  ngOnInit() {
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

  openAlertsModal() {
    this.alertsModalService.openAlertsModal();
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
          });
        }
      } else {
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
        start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) +
        (firstSession.endDate
          ? ` – ${new Date(firstSession.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
          : '');
      return { schedule: dayName ?? 'By Appointment', daysTimes: time };
    }
    if (rule?.ruleType === 'by_appointment') {
      return { schedule: 'By Appointment', daysTimes: 'By appointment' };
    }
    if (rule?.daysOfWeek?.length) {
      const names = rule.daysOfWeek.map((d) => dayNames[d] ?? '').filter(Boolean);
      const schedule = names.length === 1 ? names[0] : names.length > 1 ? names.join(', ') : 'By Appointment';
      const time = [rule.startTime, rule.endTime].filter(Boolean).join(' – ') || '';
      return { schedule, daysTimes: time || 'See schedule' };
    }
    return { schedule: 'By Appointment', daysTimes: 'By appointment' };
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


  getServiceContentHtml(service: GapService): string {
    const esc = (s: string | null | undefined) =>
      (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<div class="service-header"><h3>${esc(service.service)}</h3><span class="app-body-secondary">${esc(service.daysTimes)}</span></div>` +
      `<div class="service-details"><div class="detail-row"><span>${esc(service.church)}</span></div>` +
      (service.address ? `<div class="detail-row"><span class="app-body-secondary">${esc(service.address)}</span></div>` : '') +
      '</div>';
  }

  getActionIcons(service: GapService): CardActionIcon[] {
    return [
      { icon: 'location-outline', handler: () => this.onMapPinClick(service), show: !!service.address, buttonClass: 'map-button' },
      { icon: 'call-outline', handler: () => this.onPhoneClick(service), show: true, buttonClass: 'phone-button' },
      { lucideIcon: 'heart-handshake', handler: () => this.onVolunteerClick(service), show: true, buttonClass: 'volunteer-button' },
      { icon: 'calendar-outline', handler: () => this.onCalendarClick(service), show: true, buttonClass: 'calendar-button' },
    ];
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
    if (service.phone) {
      window.open(`tel:${service.phone}`, '_self');
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
    const alert = await this.alertController.create({
      header: 'Volunteer Opportunities',
      message: `View volunteer opportunities for ${service.service}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onCalendarClick(service: GapService) {
    const alert = await this.alertController.create({
      header: 'Add to Calendar',
      message: `Add ${service.service} to calendar`,
      buttons: ['OK']
    });
    await alert.present();
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
