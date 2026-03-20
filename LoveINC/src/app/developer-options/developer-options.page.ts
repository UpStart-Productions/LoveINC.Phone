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
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  AlertController
} from '@ionic/angular/standalone';
import { OnboardingService } from '../services/onboarding.service';
import { AppUserDataService } from '../services/app-user-data.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { ServiceUnlockService } from '@upstart-productions/service-unlock';
import { GoalTrackerSeedService } from '@upstart-productions/goal-tracker';
import { SimpleBudgetDatabaseService, WeekPlanService } from '@upstart-productions/simple-budget';
import { SimpleBudgetStateService } from '../services/simple-budget-state.service';

const ONBOARDING_OPTION_LABELS: Record<string, string> = {
  'get-help': 'Get Help',
  volunteer: 'Volunteer',
  give: 'Give',
  exploring: 'Just exploring',
};

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
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox
  ],
})
export class DeveloperOptionsPage {
  seeding = false;
  seedingBudget = false;
  onboardingCompleted = false;
  onboardingSelectionLabels: string[] = [];

  /** Dev editor — mirrors stored selections (Get Help and Volunteer are mutually exclusive). */
  devGetHelp = false;
  devVolunteer = false;
  devGive = false;
  devExploring = false;

  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private alertController: AlertController,
    private serviceUnlock: ServiceUnlockService,
    private appUserData: AppUserDataService,
    private goalTrackerSeed: GoalTrackerSeedService,
    private simpleBudgetDb: SimpleBudgetDatabaseService,
    private weekPlanService: WeekPlanService,
    private budgetState: SimpleBudgetStateService
  ) {}

  ionViewWillEnter(): void {
    this.refreshOnboardingSelections();
  }

  private refreshOnboardingSelections(): void {
    this.onboardingCompleted = this.onboardingService.hasCompletedOnboarding();
    const ids = this.onboardingService.getSelectedOptions();
    this.onboardingSelectionLabels = ids.map((id) => this.onboardingOptionLabel(id));
    this.syncDevOnboardingCheckboxes(ids);
  }

  private syncDevOnboardingCheckboxes(ids: string[]): void {
    const s = new Set(ids);
    this.devGetHelp = s.has('get-help');
    this.devVolunteer = s.has('volunteer');
    this.devGive = s.has('give');
    this.devExploring = s.has('exploring');
  }

  private applyDevOnboardingSelections(next: Set<string>): void {
    this.onboardingService.updateOnboardingData({ selectedOptions: Array.from(next) });
    this.refreshOnboardingSelections();
  }

  onDevGetHelpChange(event: CustomEvent): void {
    const checked = !!event.detail?.checked;
    const next = new Set(this.onboardingService.getSelectedOptions());
    if (checked) {
      next.delete('volunteer');
      next.add('get-help');
      next.delete('exploring');
    } else {
      next.delete('get-help');
    }
    this.applyDevOnboardingSelections(next);
  }

  onDevVolunteerChange(event: CustomEvent): void {
    const checked = !!event.detail?.checked;
    const next = new Set(this.onboardingService.getSelectedOptions());
    if (checked) {
      next.delete('get-help');
      next.add('volunteer');
      next.delete('exploring');
    } else {
      next.delete('volunteer');
    }
    this.applyDevOnboardingSelections(next);
  }

  onDevGiveChange(event: CustomEvent): void {
    const checked = !!event.detail?.checked;
    const next = new Set(this.onboardingService.getSelectedOptions());
    if (checked) {
      next.add('give');
      next.delete('exploring');
    } else {
      next.delete('give');
    }
    this.applyDevOnboardingSelections(next);
  }

  onDevExploringChange(event: CustomEvent): void {
    const checked = !!event.detail?.checked;
    if (checked) {
      this.applyDevOnboardingSelections(new Set(['exploring']));
    } else {
      const next = new Set(this.onboardingService.getSelectedOptions());
      next.delete('exploring');
      this.applyDevOnboardingSelections(next);
    }
  }

  private onboardingOptionLabel(id: string): string {
    if (ONBOARDING_OPTION_LABELS[id]) {
      return ONBOARDING_OPTION_LABELS[id];
    }
    return id
      .split('-')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');
  }

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

  async seedSimpleBudget() {
    this.seedingBudget = true;
    try {
      await this.weekPlanService.seedBudgetData();
      this.budgetState.selectedWeekStart = '2026-03-08';
      this.router.navigate(['/tabs/simple-budget/weekly']);
      const alert = await this.alertController.create({
        header: 'Simple Budget Seeded',
        message: 'Seeded 11 weeks (Dec 28, 2025 – Mar 8, 2026). Navigating to Simple Budget.',
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
      this.seedingBudget = false;
    }
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
