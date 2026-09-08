import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonInput,
} from '@ionic/angular/standalone';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import lottie, { type AnimationItem } from 'lottie-web';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { UserProfileService } from '../services/user-profile.service';

/** TEMP marketing dummy — revert donate-money + action-sheet wiring after screen videos. */
export type DonationFrequency = 'one-time' | 'monthly' | 'quarterly';
type CheckoutView = 'form' | 'apple-pay' | 'google-pay' | 'thanks';

@Component({
  selector: 'app-donate-money',
  templateUrl: 'donate-money.page.html',
  styleUrls: ['donate-money.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonInput,
    AppBackButtonComponent,
  ],
})
export class DonateMoneyPage implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('checkmarkBurst') private burstRef?: ElementRef<HTMLDivElement>;
  private burstAnim?: AnimationItem;
  private burstPlayed = false;
  view: CheckoutView = 'form';
  donationFrequency: DonationFrequency = 'monthly';
  selectedAmount: number | null = 50;
  customAmount = '';
  coverFees = true;
  giveInHonor = false;
  firstName = '';
  lastName = '';
  email = '';
  amountModalOpen = false;
  amountDraft = '';

  readonly keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const;

  readonly frequencies: { id: DonationFrequency; label: string }[] = [
    { id: 'one-time', label: 'One-time' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
  ];

  readonly presetAmounts = [25, 50, 100, 250];

  constructor(private userProfile: UserProfileService) {}

  async ionViewWillEnter(): Promise<void> {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    } catch {
      // Keyboard plugin not available
    }
  }

  async ionViewWillLeave(): Promise<void> {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.None });
    } catch {
      // Keyboard plugin not available
    }
  }

  ngOnInit(): void {
    const profile = this.userProfile.getProfile();
    this.firstName = profile.firstName?.trim() || 'Jordan';
    this.lastName = profile.lastName?.trim() || 'Lee';
    this.email = profile.email?.trim() || 'jordan.lee@email.com';
  }

  selectAmount(amount: number): void {
    this.selectedAmount = amount;
    this.customAmount = '';
  }

  openAmountModal(): void {
    this.amountDraft = this.customAmount;
    this.amountModalOpen = true;
  }

  closeAmountModal(): void {
    this.amountModalOpen = false;
  }

  pressKeypad(key: string): void {
    if (key === 'back') {
      this.amountDraft = this.amountDraft.slice(0, -1);
      return;
    }
    if (key === '.') {
      if (this.amountDraft.includes('.')) return;
      this.amountDraft = `${this.amountDraft || '0'}.`;
      return;
    }
    const [whole, frac] = this.amountDraft.split('.');
    if (frac !== undefined && frac.length >= 2) return;
    if (frac === undefined && whole.length >= 5) return;
    this.amountDraft = `${this.amountDraft}${key}`.replace(/^0+(?=\d)/, '');
  }

  confirmAmountModal(): void {
    if (!this.amountModalValid) return;
    this.customAmount = this.amountDraft;
    this.selectedAmount = null;
    this.amountModalOpen = false;
  }

  get amountModalValue(): number {
    const parsed = parseFloat(this.amountDraft);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  get amountModalValid(): boolean {
    return this.amountModalValue >= 1;
  }

  get amountModalDisplay(): string {
    if (!this.amountDraft) return '$0';
    if (this.amountDraft.endsWith('.')) return `$${this.amountDraft}`;
    return this.formatMoney(this.amountModalValue);
  }

  get baseAmount(): number | null {
    if (this.customAmount) {
      const parsed = parseFloat(this.customAmount);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    return this.selectedAmount;
  }

  get feeAmount(): number {
    const amount = this.baseAmount;
    if (!amount) return 0;
    return Math.round((amount * 0.029 + 0.3) * 100) / 100;
  }

  get totalAmount(): number | null {
    const amount = this.baseAmount;
    if (!amount) return null;
    return this.coverFees ? Math.round((amount + this.feeAmount) * 100) / 100 : amount;
  }

  get frequencyLabel(): string {
    switch (this.donationFrequency) {
      case 'monthly':
        return 'monthly';
      case 'quarterly':
        return 'quarterly';
      default:
        return '';
    }
  }

  get canDonate(): boolean {
    return this.totalAmount !== null && this.totalAmount > 0;
  }

  formatMoney(value: number | null): string {
    if (value == null) return '$0';
    return value % 1 === 0 ? `$${value}` : `$${value.toFixed(2)}`;
  }

  openApplePay(): void {
    if (!this.canDonate) return;
    this.view = 'apple-pay';
  }

  openGooglePay(): void {
    if (!this.canDonate) return;
    this.view = 'google-pay';
  }

  confirmWalletPay(): void {
    this.showThanks();
  }

  donateWithCard(): void {
    if (!this.canDonate) return;
    this.showThanks();
  }

  closeSheet(): void {
    this.burstAnim?.destroy();
    this.burstAnim = undefined;
    this.burstPlayed = false;
    this.view = 'form';
  }

  ngAfterViewChecked(): void {
    if (this.view !== 'thanks' || this.burstPlayed || !this.burstRef) return;
    this.burstPlayed = true;
    this.burstAnim?.destroy();
    this.burstAnim = lottie.loadAnimation({
      container: this.burstRef.nativeElement,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: 'assets/custom-icons/checkmark-burst.json',
    });
  }

  ngOnDestroy(): void {
    this.burstAnim?.destroy();
  }

  private showThanks(): void {
    this.burstPlayed = false;
    this.view = 'thanks';
  }
}
