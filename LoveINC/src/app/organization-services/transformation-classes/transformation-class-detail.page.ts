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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personCircleOutline, calendarOutline, personOutline, linkOutline } from 'ionicons/icons';
import { TransformationClass } from './transformation-classes.page';

@Component({
  selector: 'app-transformation-class-detail',
  templateUrl: 'transformation-class-detail.page.html',
  styleUrls: ['transformation-class-detail.page.scss'],
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonList
  ],
  providers: [AlertController]
})
export class TransformationClassDetailPage implements OnInit {
  classItem: TransformationClass | null = null;
  classId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController
  ) {
    addIcons({ personCircleOutline, calendarOutline, personOutline, linkOutline });
  }

  ngOnInit() {
    this.classId = this.route.snapshot.paramMap.get('id') || '';
    this.loadClassDetail();
  }

  loadClassDetail() {
    this.http.get<TransformationClass[]>('assets/data/transformation-classes.json').subscribe({
      next: (data) => {
        this.classItem = data.find(c => c.id === this.classId) || null;
      },
      error: (err) => {
        console.error('Error loading class detail:', err);
      }
    });
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  async onRegisterClick() {
    if (!this.classItem) return;
    
    const alert = await this.alertController.create({
      header: 'Register',
      message: `Opening registration for ${this.classItem.title}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onAddToCalendarClick() {
    if (!this.classItem) return;
    
    const alert = await this.alertController.create({
      header: 'Add to Calendar',
      message: `Add ${this.classItem.title} to your calendar`,
      buttons: ['OK']
    });
    await alert.present();
  }

  formatSessionDates(): string {
    if (!this.classItem) return '';
    const startDate = new Date(this.classItem.nextSession.startDate);
    const endDate = new Date(this.classItem.nextSession.endDate);
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  }
}
