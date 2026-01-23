import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonInput,
  IonCheckbox
} from '@ionic/angular/standalone';
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
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonInput,
    IonCheckbox
  ],
})
export class DonateMoneyPage {
  donationFrequency: 'one-time' | 'monthly' | 'quarterly' = 'monthly';
  selectedAmount: number | null = null;
  customAmount: string = '';
  addNote: boolean = false;
  giveInHonor: boolean = false;

  presetAmounts = [250, 100, 50, 25, 20, 10];

  constructor(private router: Router) {}

  selectAmount(amount: number) {
    this.selectedAmount = amount;
    this.customAmount = '';
  }

  onCustomAmountChange() {
    if (this.customAmount) {
      this.selectedAmount = null;
    }
  }

  getSelectedAmount(): number | null {
    if (this.customAmount) {
      const parsed = parseFloat(this.customAmount);
      return isNaN(parsed) ? null : parsed;
    }
    return this.selectedAmount;
  }

  canContinue(): boolean {
    return this.getSelectedAmount() !== null && this.getSelectedAmount()! > 0;
  }

  onContinue() {
    const amount = this.getSelectedAmount();
    if (amount && amount > 0) {
      console.log('Donation Details:', {
        frequency: this.donationFrequency,
        amount: amount,
        addNote: this.addNote,
        giveInHonor: this.giveInHonor
      });
      // TODO: Navigate to payment/checkout page
    }
  }
}
