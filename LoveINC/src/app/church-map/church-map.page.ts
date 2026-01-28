import { Component, OnInit, OnDestroy, NgZone, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons,
  IonButton,
  IonBackButton,
  IonPopover,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonList
} from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular';
import { ChurchDetailsPopoverComponent } from './church-details-popover.component';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { AlertsModalService } from '../services/alerts-modal.service';

declare var google: any;

export interface PartnerChurch {
  id: string;
  churchName: string;
  ministries: string[];
  type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
}

@Component({
  selector: 'app-church-map',
  templateUrl: 'church-map.page.html',
  styleUrls: ['church-map.page.scss'],
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
    IonIcon
  ],
  providers: [PopoverController]
})
export class ChurchMapPage implements OnInit, OnDestroy, AfterViewInit {
  map: any;
  markers: any[] = [];
  churches: PartnerChurch[] = [];
  selectedChurch: PartnerChurch | null = null;
  popover: any = null;
  router = this.routerInstance;
  showDonateButton: boolean = false;

  constructor(
    private routerInstance: Router,
    private http: HttpClient,
    private ngZone: NgZone,
    private popoverController: PopoverController,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private alertsModalService: AlertsModalService
  ) {}

  ngOnInit() {
    this.loadChurches();
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  openAlertsModal() {
    this.alertsModalService.openAlertsModal();
  }

  ngAfterViewInit() {
    // Ensure view is initialized before trying to create map
    if (this.churches.length > 0) {
      this.initMap();
    }
  }

  ngOnDestroy() {
    // Clean up map if needed
    if (this.map) {
      this.map = null;
    }
  }

  loadChurches() {
    this.http.get<PartnerChurch[]>('assets/data/partner-churches.json').subscribe({
      next: (data) => {
        // Filter out churches without coordinates and collaborative/community partners
        this.churches = data.filter(
          church => 
            church.latitude !== null && 
            church.longitude !== null &&
            church.type === 'church' &&
            church.id !== 'church-collaboratives' &&
            church.id !== 'community-partners'
        );
        // Init map after view is ready
        setTimeout(() => this.initMap(), 100);
      },
      error: (err) => {
        console.error('Error loading churches:', err);
      }
    });
  }

  async initMap() {
    // Wait for Google Maps to load
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    // Check if map element exists
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    // Center on Newberg, Oregon
    const center = { lat: 45.3015, lng: -122.9730 };

    // Create map
    this.map = new google.maps.Map(
      mapElement,
      {
        zoom: 13,
        center: center,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      }
    );

    // Add markers for each church
    this.churches.forEach((church) => {
      if (church.latitude && church.longitude) {
        const marker = new google.maps.Marker({
          position: { lat: church.latitude, lng: church.longitude },
          map: this.map,
          title: church.churchName,
          animation: google.maps.Animation.DROP
        });

        // Add click listener
        marker.addListener('click', () => {
          this.ngZone.run(() => {
            this.showChurchPopover(marker, church);
          });
        });

        this.markers.push(marker);
      }
    });
  }

  async showChurchPopover(marker: any, church: PartnerChurch) {
    // Close any existing popover
    if (this.popover) {
      await this.popover.dismiss();
    }

    this.selectedChurch = church;

    // Get marker position and convert to screen coordinates
    const position = marker.getPosition();
    const overlay = new google.maps.OverlayView();
    overlay.setMap(this.map);
    
    overlay.draw = function() {};
    
    // Get pixel coordinates from lat/lng
    const projection = overlay.getProjection();
    const point = projection.fromLatLngToContainerPixel(position);
    
    const mapDiv = document.getElementById('map');
    const rect = mapDiv!.getBoundingClientRect();
    
    // Create a synthetic click event at the marker position
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + point.x,
      clientY: rect.top + point.y
    });

    // Create popover
    this.popover = await this.popoverController.create({
      component: ChurchDetailsPopoverComponent,
      componentProps: {
        church: church,
        formatAddress: (ch: PartnerChurch) => this.formatAddress(ch)
      },
      event: event,
      showBackdrop: false,
      cssClass: 'church-popover',
      arrow: false
    });

    await this.popover.present();

    // Handle dismissal
    this.popover.onDidDismiss().then(() => {
      this.popover = null;
      this.selectedChurch = null;
    });
  }

  formatAddress(church: PartnerChurch): string {
    const parts = [];
    if (church.address) parts.push(church.address);
    if (church.city) parts.push(church.city);
    if (church.state) parts.push(church.state);
    if (church.zip) parts.push(church.zip);
    return parts.join(', ') || 'Address not available';
  }
}
