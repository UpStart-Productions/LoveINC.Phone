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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/angular/standalone';
export interface TransformationClass {
  id: string;
  title: string;
  description: string;
  teacher: string;
  photoUrl: string;
  registrationLink: string;
  nextSession: {
    startDate: string;
    endDate: string;
    dayOfWeek: string;
    time: string;
  };
}

@Component({
  selector: 'app-transformation-classes',
  templateUrl: 'transformation-classes.page.html',
  styleUrls: ['transformation-classes.page.scss'],
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent
  ],
})
export class TransformationClassesPage implements OnInit {
  classes: TransformationClass[] = [];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadClasses();
  }

  loadClasses() {
    this.http.get<TransformationClass[]>('assets/data/transformation-classes.json').subscribe({
      next: (data) => {
        this.classes = data;
      },
      error: (err) => {
        console.error('Error loading transformation classes:', err);
      }
    });
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  navigateToClassDetail(classItem: TransformationClass) {
    this.router.navigate(['/tabs/transformation-classes', classItem.id]);
  }

  formatSessionDates(classItem: TransformationClass): string {
    const startDate = new Date(classItem.nextSession.startDate);
    const endDate = new Date(classItem.nextSession.endDate);
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startMonth} - ${endMonth}`;
  }
}
