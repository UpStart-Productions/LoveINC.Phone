import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { AlertsService, Alert } from '../../services/alerts.service';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-alerts-modal',
  templateUrl: './alerts-modal.component.html',
  styleUrls: ['./alerts-modal.component.scss'],
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
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
  ],
})
export class AlertsModalComponent implements OnInit {
  alerts: Alert[] = [];
  loading = true;

  constructor(
    private modalController: ModalController,
    private alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.alertsService.getAlerts().subscribe({
      next: (data) => {
        // Generate random dates for demo purposes
        const alertsWithRandomDates = (data ?? []).map(alert => ({
          ...alert,
          date: this.generateRandomDate()
        }));
        
        this.alerts = alertsWithRandomDates.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
      error: () => {
        this.alerts = [];
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  /**
   * Generate a random date within the past for demo purposes
   * Creates a mix of recent times: Now, minutes, hours, days, weeks
   */
  private generateRandomDate(): string {
    const now = new Date();
    const random = Math.random();
    
    // Weighted distribution: more recent times are more common
    let minutesAgo: number;
    
    if (random < 0.15) {
      // 15% chance: "Now" (0-1 minute)
      minutesAgo = Math.floor(Math.random() * 1);
    } else if (random < 0.35) {
      // 20% chance: 1-59 minutes ago
      minutesAgo = Math.floor(Math.random() * 59) + 1;
    } else if (random < 0.55) {
      // 20% chance: 1-23 hours ago
      minutesAgo = Math.floor(Math.random() * 23 * 60) + 60;
    } else if (random < 0.75) {
      // 20% chance: 1-6 days ago
      minutesAgo = Math.floor(Math.random() * 6 * 24 * 60) + (24 * 60);
    } else if (random < 0.90) {
      // 15% chance: 1-3 weeks ago
      minutesAgo = Math.floor(Math.random() * 3 * 7 * 24 * 60) + (7 * 24 * 60);
    } else {
      // 10% chance: 1-2 months ago
      minutesAgo = Math.floor(Math.random() * 2 * 30 * 24 * 60) + (30 * 24 * 60);
    }
    
    const date = new Date(now.getTime() - (minutesAgo * 60 * 1000));
    return date.toISOString();
  }

  close(): void {
    this.modalController.dismiss();
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    
    // If less than 1 minute ago, show "Now"
    if (diffMs < 60000) {
      return 'Now';
    }
    
    // Calculate time differences
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Format based on time difference
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `${diffHours} hr`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`;
    } else if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
    } else {
      return `${diffYears} year${diffYears !== 1 ? 's' : ''}`;
    }
  }

  hasUnreadAlerts(): boolean {
    return this.alerts.some(alert => !alert.read);
  }

  markAsRead(index: number): void {
    if (this.alerts[index] && !this.alerts[index].read) {
      this.alerts[index].read = true;
    }
  }

  markAllAsRead(): void {
    this.alerts.forEach(alert => {
      alert.read = true;
    });
  }
}
