import { Component, OnInit } from '@angular/core';
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
  IonIcon,
  IonItem,
  IonLabel,
  IonSearchbar
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { CardComponent, CardActionIcon } from '../components/card/card.component';

interface DonationLocation {
  id: string;
  category: string;
  organization: string;
  address: string | null;
  phone: string | null;
  email?: string | null;
  hours: string | null;
  acceptedItems: string[];
  notes: string | null;
  contact?: string | null;
}

@Component({
  selector: 'app-donate-goods',
  templateUrl: 'donate-goods.page.html',
  styleUrls: ['donate-goods.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonSearchbar,
    CardComponent
  ],
  providers: [AlertController]
})
export class DonateGoodsPage implements OnInit {
  locations: DonationLocation[] = [];
  filteredLocations: DonationLocation[] = [];
  groupedLocations: { [key: string]: DonationLocation[] } = {};
  categoryOrder: string[] = [];
  searchQuery: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadLocations();
  }

  loadLocations() {
    this.http.get<DonationLocation[]>('assets/data/donation-locations.json').subscribe({
      next: (data) => {
        // Sort accepted items alphabetically for each location
        this.locations = data.map(location => ({
          ...location,
          acceptedItems: location.acceptedItems?.slice().sort((a, b) => 
            a.localeCompare(b, undefined, { sensitivity: 'base' })
          ) || []
        }));
        this.filteredLocations = this.locations;
        this.groupLocationsByCategory();
      },
      error: (err) => {
        console.error('Error loading donation locations:', err);
      }
    });
  }

  groupLocationsByCategory() {
    this.groupedLocations = {};
    this.filteredLocations.forEach(location => {
      const category = location.category;
      if (!this.groupedLocations[category]) {
        this.groupedLocations[category] = [];
      }
      this.groupedLocations[category].push(location);
    });
    
    // Set category order based on first occurrence in data
    this.categoryOrder = Object.keys(this.groupedLocations);
  }

  onSearchChange(event: any) {
    const query = event.detail.value?.toLowerCase().trim() || '';
    this.searchQuery = query;

    if (!query) {
      this.filteredLocations = this.locations;
    } else {
      this.filteredLocations = this.locations.filter(location => {
        // Search across all fields
        const searchFields = [
          location.category,
          location.organization,
          location.address,
          location.phone,
          location.email,
          location.hours,
          location.notes,
          location.contact,
          ...(location.acceptedItems || [])
        ].filter(field => field != null).map(field => String(field).toLowerCase());

        return searchFields.some(field => field.includes(query));
      });
    }

    this.groupLocationsByCategory();
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  getActionIcons(location: DonationLocation): CardActionIcon[] {
    return [
      { icon: 'location-outline', handler: () => this.onMapPinClick(location), show: !!location.address, buttonClass: 'map-button' },
      { icon: 'call-outline', handler: () => this.onPhoneClick(location), show: !!location.phone, buttonClass: 'phone-button' },
      { icon: 'mail-outline', handler: () => this.onEmailClick(location), show: !!location.email, buttonClass: 'email-button' },
    ];
  }

  async onMapPinClick(location: DonationLocation) {
    const alert = await this.alertController.create({
      header: 'Map',
      message: `Show map for ${location.organization}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onPhoneClick(location: DonationLocation) {
    if (location.phone) {
      const alert = await this.alertController.create({
        header: 'Phone',
        message: `Call ${location.organization} at ${location.phone}`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Call',
            handler: () => {
              window.location.href = `tel:${location.phone}`;
            }
          }
        ]
      });
      await alert.present();
    }
  }

  async onEmailClick(location: DonationLocation) {
    if (location.email) {
      const alert = await this.alertController.create({
        header: 'Email',
        message: `Email ${location.organization} at ${location.email}`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Email',
            handler: () => {
              window.location.href = `mailto:${location.email}`;
            }
          }
        ]
      });
      await alert.present();
    }
  }
}