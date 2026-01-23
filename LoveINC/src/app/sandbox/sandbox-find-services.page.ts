import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonChip,
  IonItem,
  IonLabel,
  AlertController
} from '@ionic/angular/standalone';
import { CardComponent, CardActionIcon } from '../components/card/card.component';

interface GapService {
  id: string;
  service: string;
  schedule: string;
  daysTimes: string;
  church: string;
  address: string | null;
  contact: string;
  contactMethod: string;
  notes: string | null;
}

interface NeedCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  keywords: string[];
}

@Component({
  selector: 'app-sandbox-find-services',
  templateUrl: './sandbox-find-services.page.html',
  styleUrls: ['./sandbox-find-services.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonChip,
    IonItem,
    IonLabel,
    CardComponent
  ]
})
export class SandboxFindServicesPage implements OnInit {
  private alertController = inject(AlertController);
  
  allServices: GapService[] = [];
  filteredServices: GapService[] = [];
  selectedNeeds: Set<string> = new Set();

  needCategories: NeedCategory[] = [
    {
      id: 'food',
      label: 'Food',
      icon: 'restaurant-outline',
      color: '#eaa535',
      keywords: ['meal', 'food', 'community meal', 'pantry']
    },
    {
      id: 'clothing',
      label: 'Clothing',
      icon: 'shirt-outline',
      color: '#349394',
      keywords: ['clothing', 'clothes', 'diapers', 'linens']
    },
    {
      id: 'household',
      label: 'Household Items',
      icon: 'home-outline',
      color: '#214491',
      keywords: ['linens', 'kitchen', 'household']
    },
    {
      id: 'medical',
      label: 'Medical',
      icon: 'medical-outline',
      color: '#ef4444',
      keywords: ['meds', 'medical', 'medicine', 'health']
    },
    {
      id: 'utilities',
      label: 'Utilities',
      icon: 'flash-outline',
      color: '#8b5cf6',
      keywords: ['firewood', 'utilities', 'heat', 'warmth']
    },
    {
      id: 'support',
      label: 'Support Services',
      icon: 'people-outline',
      color: '#10b981',
      keywords: ['drop in', 'center', 'support', 'community']
    }
  ];

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.http.get<GapService[]>('assets/data/gap-services.json').subscribe({
      next: (data) => {
        this.allServices = data;
        this.filterServices();
      },
      error: (err) => {
        console.error('Error loading services:', err);
      }
    });
  }

  toggleNeed(needId: string) {
    if (this.selectedNeeds.has(needId)) {
      this.selectedNeeds.delete(needId);
    } else {
      this.selectedNeeds.add(needId);
    }
    this.filterServices();
  }

  isNeedSelected(needId: string): boolean {
    return this.selectedNeeds.has(needId);
  }

  filterServices() {
    if (this.selectedNeeds.size === 0) {
      this.filteredServices = [];
      return;
    }

    const selectedKeywords = new Set<string>();
    this.selectedNeeds.forEach(needId => {
      const category = this.needCategories.find(c => c.id === needId);
      if (category) {
        category.keywords.forEach(keyword => selectedKeywords.add(keyword.toLowerCase()));
      }
    });

    this.filteredServices = this.allServices.filter(service => {
      const serviceText = `${service.service} ${service.notes || ''}`.toLowerCase();
      return Array.from(selectedKeywords).some(keyword => serviceText.includes(keyword));
    });
  }

  getActionIcons(service: GapService): CardActionIcon[] {
    const actions: CardActionIcon[] = [];

    if (service.address) {
      actions.push({
        icon: 'location-outline',
        handler: () => this.onMapClick(service),
        show: true,
        buttonClass: 'map-button'
      });
    }

    if (service.contactMethod === 'direct' || service.contactMethod === 'call_loveinc') {
      actions.push({
        icon: 'call-outline',
        handler: () => this.onPhoneClick(service),
        show: true,
        buttonClass: 'phone-button'
      });
    }

    return actions;
  }

  async onMapClick(service: GapService) {
    const alert = await this.alertController.create({
      header: 'Map',
      message: `Show map for ${service.church}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onPhoneClick(service: GapService) {
    const alert = await this.alertController.create({
      header: 'Contact',
      message: `${service.contact}`,
      buttons: ['OK']
    });
    await alert.present();
  }
}
