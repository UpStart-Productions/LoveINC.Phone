import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  IonList
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { ContentDetail, ContentType } from './content-detail.model';
import { SharingService } from '../../services/sharing/sharing.service';
import { PlatformApiService, type PlatformClass } from '../../services/platform-api.service';

@Component({
  selector: 'app-content-detail',
  templateUrl: 'content-detail.page.html',
  styleUrls: ['content-detail.page.scss'],
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
    IonList
  ],
  providers: [AlertController]
})
export class ContentDetailPage implements OnInit {
  contentItem: ContentDetail | null = null;
  contentType: ContentType = 'class';
  contentId: string = '';
  backRoute: string = '/tabs/home';
  pageTitle: string = 'Details';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private sharingService: SharingService,
    private platformApi: PlatformApiService
  ) {}

  ngOnInit() {
    this.contentType = (this.route.snapshot.paramMap.get('type') as ContentType) || 'class';
    this.contentId = this.route.snapshot.paramMap.get('id') || '';
    
    // Determine back route based on content type or query param
    const fromParam = this.route.snapshot.queryParamMap.get('from');
    if (fromParam) {
      this.backRoute = `/tabs/${fromParam}`;
    } else {
      this.backRoute = this.getDefaultBackRoute();
    }
    
    // Set page title based on content type
    this.pageTitle = this.getPageTitle();
    
    this.loadContentDetail();
  }

  private getDefaultBackRoute(): string {
    switch (this.contentType) {
      case 'event':
        return '/tabs/updates';
      case 'class':
        return '/tabs/transformation-classes';
      case 'impact-story':
        return '/tabs/impact-stories';
      case 'gap-ministry':
        return '/tabs/gap-ministries';
      case 'volunteer':
      case 'donation-drive':
      case 'church-partner':
      case 'donation-opportunity':
      default:
        return '/tabs/home';
    }
  }

  private getPageTitle(): string {
    switch (this.contentType) {
      case 'event':
        return 'Event Details';
      case 'class':
        return 'Class Details';
      case 'impact-story':
        return 'Impact Story';
      case 'gap-ministry':
        return 'Gap Ministry Details';
      case 'volunteer':
        return 'Volunteer Opportunity';
      case 'donation-drive':
        return 'Donation Drive';
      case 'church-partner':
        return 'Church Partner';
      case 'donation-opportunity':
        return 'Donation Opportunity';
      default:
        return 'Details';
    }
  }

  loadContentDetail() {
    if (this.contentType === 'class') {
      this.loadClassFromApi();
      return;
    }

    const dataFile = this.getDataFile();
    if (!dataFile) {
      console.error('Unknown content type:', this.contentType);
      return;
    }

    this.http.get<any[]>(dataFile).subscribe({
      next: (data) => {
        // If loading from home-cards.json, filter by type and map to ContentDetail
        if (dataFile === 'assets/data/home-cards.json') {
          // Map content-detail types to home-card types
          const cardTypeMap: Record<string, string> = {
            'impact-story': 'impact',
            'donation-opportunity': 'donation-opportunity',
            'volunteer': 'volunteer',
            'donation-drive': 'donation-drive',
            'church-partner': 'church-partner',
            'gap-ministry': 'gap-ministry',
            'class': 'class',
            'event': 'event',
          };
          const homeCardType = cardTypeMap[this.contentType] || this.contentType;
          const filteredData = data.filter(item => item.type === homeCardType);
          this.contentItem = filteredData.find(item => item.id === this.contentId) || null;
        } else {
          // For other data files, use direct lookup
          this.contentItem = data.find(item => item.id === this.contentId) || null;
        }
        
        if (!this.contentItem) {
          console.error('Content item not found:', this.contentId);
        }
      },
      error: (err) => {
        console.error('Error loading content detail:', err);
      }
    });
  }

  private loadClassFromApi() {
    this.platformApi.getClasses().subscribe({
      next: (classes) => {
        const c = classes.find(cls => cls.id === this.contentId);
        this.contentItem = c ? this.mapPlatformClassToContentDetail(c) : null;
        if (!this.contentItem) {
          console.error('Class not found:', this.contentId);
        }
      },
      error: (err) => {
        console.error('Error loading class detail:', err);
      }
    });
  }

  private mapPlatformClassToContentDetail(c: PlatformClass): ContentDetail {
    let location: string | undefined;
    if (c.address) {
      const parts = [c.address.locationName, c.address.address, c.address.city, c.address.state, c.address.zip].filter(Boolean);
      location = parts.join(', ');
    }
    return {
      id: c.id,
      title: c.title,
      description: c.longDescription ?? c.shortDescription ?? '',
      photoUrl: (this.platformApi.resolveUploadUrl(c.photoUrl) || c.photoUrl) ?? '',
      teacher: c.instructor,
      location,
      durationMinutes: c.durationMinutes,
      cost: c.cost,
    };
  }

  private getDataFile(): string | null {
    switch (this.contentType) {
      case 'event':
        return 'assets/data/updates-events.json';
      case 'class':
        return 'assets/data/transformation-classes.json';
      case 'impact-story':
        // TODO: Add impact stories data file when available
        return 'assets/data/home-cards.json';
      case 'gap-ministry':
        return 'assets/data/gap-services.json';
      case 'volunteer':
      case 'donation-drive':
      case 'church-partner':
      case 'donation-opportunity':
        // These types use home-cards.json as their data source
        return 'assets/data/home-cards.json';
      default:
        return 'assets/data/home-cards.json';
    }
  }

  async onShareClick() {
    if (!this.contentItem) return;
    
    const htmlContent = this.buildShareContent();
    
    await this.sharingService.shareContent({
      title: this.contentItem.title,
      subject: `Love INC ${this.getContentTypeLabel()}: ${this.contentItem.title}`,
      htmlContent: htmlContent
    });
  }

  async onAddToCalendarClick() {
    if (!this.contentItem) return;
    
    const alert = await this.alertController.create({
      header: 'Add to Calendar',
      message: `Add ${this.contentItem.title} to your calendar`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onActionButtonClick() {
    if (!this.contentItem) return;
    
    if (this.contentItem.registrationLink) {
      // Open registration link
      window.open(this.contentItem.registrationLink, '_blank');
    } else if (this.contentItem.actionButtonLink) {
      // Open action link
      window.open(this.contentItem.actionButtonLink, '_blank');
    } else {
      // Default action
      const alert = await this.alertController.create({
        header: this.contentItem.actionButtonText || 'Action',
        message: `Action for ${this.contentItem.title}`,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  formatSessionDates(): string {
    if (!this.contentItem?.nextSession) return '';
    const startDate = new Date(this.contentItem.nextSession.startDate);
    const endDate = new Date(this.contentItem.nextSession.endDate);
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  }

  isEvent(): boolean {
    return this.contentType === 'event';
  }

  hasInstructor(): boolean {
    return !!this.contentItem?.teacher;
  }

  hasSchedule(): boolean {
    return !!this.contentItem?.nextSession;
  }

  hasLocation(): boolean {
    return !!this.contentItem?.location;
  }

  hasEventDateTime(): boolean {
    return !!(this.contentItem?.eventDate || this.contentItem?.eventTime);
  }

  hasActionButton(): boolean {
    return !!(this.contentItem?.registrationLink || this.contentItem?.actionButtonLink || this.contentItem?.actionButtonText);
  }

  hasClassDocuments(): boolean {
    return !!(this.contentItem?.classDocuments && this.contentItem.classDocuments.length > 0);
  }

  hasDuration(): boolean {
    return !!(this.contentItem?.durationMinutes && this.contentItem.durationMinutes > 0);
  }

  hasCost(): boolean {
    return !!(this.contentItem?.cost && this.contentItem.cost.trim().length > 0);
  }

  formatDuration(): string {
    const mins = this.contentItem?.durationMinutes ?? 0;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainder = mins % 60;
      return remainder > 0 ? `${hours} hr ${remainder} min` : `${hours} hr`;
    }
    return `${mins} min`;
  }

  getDocumentTypeIcon(type?: string): string {
    switch (type) {
      case 'handout':
        return 'document-text-outline';
      case 'worksheet':
        return 'create-outline';
      case 'resource':
        return 'library-outline';
      default:
        return 'document-outline';
    }
  }

  private buildShareContent(): string {
    if (!this.contentItem) return '';
    
    let html = `<h2>${this.contentItem.title}</h2>`;
    
    if (this.contentItem.subtitle) {
      html += `<p><strong>${this.contentItem.subtitle}</strong></p>`;
    }
    
    if (this.contentItem.description) {
      html += `<p>${this.contentItem.description}</p>`;
    }
    
    if (this.contentItem.teacher) {
      html += `<p><strong>Instructor:</strong> ${this.contentItem.teacher}</p>`;
    }
    
    if (this.contentItem.nextSession) {
      html += `<p><strong>Schedule:</strong> ${this.contentItem.nextSession.dayOfWeek} ${this.contentItem.nextSession.time}</p>`;
      html += `<p>${this.formatSessionDates()}</p>`;
    }
    
    if (this.contentItem.eventDate || this.contentItem.eventTime) {
      html += `<p><strong>Date/Time:</strong> ${this.contentItem.eventDate || ''} ${this.contentItem.eventTime || ''}</p>`;
    }
    
    if (this.contentItem.location) {
      html += `<p><strong>Location:</strong> ${this.contentItem.location}</p>`;
    }
    
    if (this.contentItem.durationMinutes) {
      html += `<p><strong>Duration:</strong> ${this.formatDuration()}</p>`;
    }
    
    if (this.contentItem.cost) {
      html += `<p><strong>Cost:</strong> ${this.contentItem.cost}</p>`;
    }
    
    return html;
  }

  private getContentTypeLabel(): string {
    switch (this.contentType) {
      case 'event':
        return 'Event';
      case 'class':
        return 'Class';
      case 'impact-story':
        return 'Impact Story';
      case 'gap-ministry':
        return 'Gap Ministry';
      case 'volunteer':
        return 'Volunteer Opportunity';
      case 'donation-drive':
        return 'Donation Drive';
      case 'church-partner':
        return 'Church Partner';
      case 'donation-opportunity':
        return 'Donation Opportunity';
      default:
        return 'Content';
    }
  }
}
