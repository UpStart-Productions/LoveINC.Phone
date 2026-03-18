import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  AlertController
} from '@ionic/angular/standalone';
import { OnboardingService } from '../services/onboarding.service';
import { AppUserDataService } from '../services/app-user-data.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { ServiceUnlockService } from '@upstart-productions/service-unlock';
import { GoalTrackerSeedService } from '@upstart-productions/goal-tracker';
import { SimpleBudgetDatabaseService } from '@upstart-productions/simple-budget';

@Component({
  selector: 'app-developer-options',
  templateUrl: 'developer-options.page.html',
  styleUrls: ['developer-options.page.scss'],
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon
  ],
})
export class DeveloperOptionsPage {
  seeding = false;

  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private alertController: AlertController,
    private serviceUnlock: ServiceUnlockService,
    private appUserData: AppUserDataService,
    private goalTrackerSeed: GoalTrackerSeedService,
    private simpleBudgetDb: SimpleBudgetDatabaseService
  ) {}

  resetOnboarding() {
    this.onboardingService.clearOnboarding();
    this.router.navigate(['/onboarding/step1']).then(() => {
      window.location.reload();
    });
  }

  private getRandomNotification(): { title: string; body: string } {
    const notifications = [
      {
        title: '🌟 New Service Available',
        body: 'Check out our latest transformational class starting this week! Join us in making a difference. 🙏'
      },
      {
        title: '💝 Thank You for Your Impact',
        body: 'Your generosity is changing lives in our community. Together we\'re building hope, one family at a time! ❤️'
      },
      {
        title: '🤝 Volunteer Opportunity',
        body: 'We need your help at the Connection Center this Saturday. Your time can transform someone\'s life! 🌟'
      },
      {
        title: '📖 Verse of the Day',
        body: '"Love one another as I have loved you." - John 13:34. Spread kindness today! 💙'
      },
      {
        title: '🎉 Impact Story Update',
        body: 'Read how Sarah\'s life was transformed through our Gap Ministries program. Your support makes this possible! ✨'
      }
    ];

    // Get random notification
    const randomIndex = Math.floor(Math.random() * notifications.length);
    return notifications[randomIndex];
  }

  async clearAccess() {
    await this.serviceUnlock.clearUnlock();
    this.appUserData.clear();
    const alert = await this.alertController.create({
      header: 'Access Cleared',
      message: 'Intake state has been reset (local unlock + cached app user data). You should now see "Intake required" and no voucher icons. If you refresh the app, it will re-fetch from the API—if you completed intake before, you may see access again.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  async clearSimpleBudget() {
    try {
      await this.simpleBudgetDb.wipeAll();
      const alert = await this.alertController.create({
        header: 'Simple Budget Cleared',
        message: 'All week plans and category data have been deleted.',
        buttons: ['OK'],
      });
      await alert.present();
    } catch (err) {
      const alert = await this.alertController.create({
        header: 'Clear Failed',
        message: (err as Error)?.message ?? 'Unknown error',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  async seedGoalTracker() {
    this.seeding = true;
    try {
      await this.goalTrackerSeed.seedDatabase();
      const alert = await this.alertController.create({
        header: 'Goal Tracker Seeded',
        message:
          'Database has been reset and seeded with 5 goals (2 completed), 11 habits, and ~1 year of completion data (Sept 2025 – Sept 2026).',
        buttons: ['OK'],
      });
      await alert.present();
    } catch (err) {
      const alert = await this.alertController.create({
        header: 'Seed Failed',
        message: (err as Error)?.message ?? 'Unknown error',
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.seeding = false;
    }
  }

  async clearVouchers() {
    this.serviceUnlock.clearVouchers();
    const alert = await this.alertController.create({
      header: 'Vouchers Cleared',
      message: 'Vouchers have been cleared. (Mock data will reappear on next app load.)',
      buttons: ['OK'],
    });
    await alert.present();
  }

  async testLocalNotification() {
    try {
      // Check if running on native platform
      if (!Capacitor.isNativePlatform()) {
        const alert = await this.alertController.create({
          header: 'Web Platform',
          message: 'Local notifications only work on native iOS/Android devices. Please test on a physical device or emulator.',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }

      // Check if plugin is available
      if (!LocalNotifications) {
        const alert = await this.alertController.create({
          header: 'Plugin Not Available',
          message: 'Local Notifications plugin is not available. Please run "npx cap sync" to sync native plugins.',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }

      // Request permission first
      const permissionStatus = await LocalNotifications.requestPermissions();
      
      if (permissionStatus.display === 'granted') {
        // Get random notification message
        const notification = this.getRandomNotification();
        
        // Schedule a notification
        await LocalNotifications.schedule({
          notifications: [
            {
              title: notification.title,
              body: notification.body,
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 1000) }, // Show in 1 second
              sound: 'default',
              attachments: undefined,
              actionTypeId: '',
              extra: {
                test: true
              }
            }
          ]
        });

        const alert = await this.alertController.create({
          header: 'Success',
          message: 'Test notification scheduled! It will appear in 1 second.',
          buttons: ['OK']
        });
        await alert.present();
      } else {
        const alert = await this.alertController.create({
          header: 'Permission Denied',
          message: 'Please enable notification permissions in your device settings.',
          buttons: ['OK']
        });
        await alert.present();
      }
    } catch (error: any) {
      console.error('Error testing notification:', error);
      let errorMessage = 'Failed to send test notification.';
      
      if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      } else if (error.toString().includes('not available') || error.toString().includes('undefined')) {
        errorMessage = 'Local Notifications plugin is not available. Please run "npx cap sync" to sync native plugins, then rebuild the app.';
      }
      
      const alert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}
