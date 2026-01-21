import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActionSheetController, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonBadge, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, heartOutline, giftOutline, starOutline, peopleOutline, schoolOutline, timeOutline, handLeftOutline, personCircleOutline, gift, cubeOutline, shirtOutline, closeOutline } from 'ionicons/icons';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { OnboardingService } from '../services/onboarding.service';
import { HomeCard, CardTypeLabels, CardTypeIcons, CardTypeColors } from '../models/home-card.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonIcon,
    ExploreContainerComponent
  ],
})
export class HomePage implements OnInit {
  cards: HomeCard[] = [];
  cardTypeLabels = CardTypeLabels;
  cardTypeIcons = CardTypeIcons;
  cardTypeColors = CardTypeColors;
  isDonor: boolean = false;
  welcomeTitle: string = 'Welcome to Love INC.';

  constructor(
    private onboardingService: OnboardingService,
    private router: Router,
    private http: HttpClient,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({ calendarOutline, heartOutline, giftOutline, starOutline, peopleOutline, schoolOutline, timeOutline, handLeftOutline, personCircleOutline, gift, cubeOutline, shirtOutline, closeOutline });
  }

  ngOnInit() {
    this.loadCards();
    
    // Check if user selected 'give' during onboarding
    this.isDonor = this.onboardingService.hasSelectedOption('give');
    
    // Set welcome title based on first name
    const firstName = this.onboardingService.getUserFirstName();
    if (firstName) {
      this.welcomeTitle = `Welcome, ${firstName}!`;
    } else {
      this.welcomeTitle = 'Welcome to Love INC.';
    }
    
    // For testing - add to window for easy access in console
    (window as any).clearOnboarding = () => {
      this.onboardingService.clearOnboarding();
    };
  }

  loadCards() {
    this.http.get<HomeCard[]>('assets/data/home-cards.json').subscribe({
      next: (data) => {
        this.cards = data.sort((a, b) => a.priority - b.priority);
      },
      error: (err) => {
        console.error('Error loading cards:', err);
      }
    });
  }

  navigateToCard(card: HomeCard) {
    this.router.navigate([card.link]);
  }

  resetOnboarding() {
    this.onboardingService.clearOnboarding();
    this.router.navigate(['/onboarding/step1']);
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  async navigateToDonate() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Donate to Love INC Newberg',
      buttons: [
        {
          text: 'Goods like clothing, furniture, household items.',
          icon: 'shirt-outline',
          handler: () => {
            this.handleGoodsDonation();
          }
        },
        {
          text: 'Make a secure online donation.',
          icon: 'card-outline',
          handler: () => {
            this.handleOnlineDonation();
          }
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      cssClass: 'donate-action-sheet'
    });

    await actionSheet.present();
  }

  handleGoodsDonation() {
    // TODO: Navigate to goods donation page or form
    console.log('Navigate to Goods Donation');
  }

  handleOnlineDonation() {
    // TODO: Navigate to online donation page or form
    console.log('Navigate to Online Donation');
  }
}
