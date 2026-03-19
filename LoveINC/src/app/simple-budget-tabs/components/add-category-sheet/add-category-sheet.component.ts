import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonInput,
  ModalController,
} from '@ionic/angular/standalone';

const CATEGORY_ICON_MAP: Record<string, string> = {
  Paycheck: 'briefcase-outline',
  Benefits: 'heart-outline',
  'Side work': 'construct-outline',
  Other: 'ellipse-outline',
  'Rent or mortgage': 'house-outline',
  Electric: 'flash-outline',
  'Gas utility': 'flame-outline',
  Water: 'water-outline',
  Phone: 'call-outline',
  Internet: 'wifi-outline',
  Insurance: 'shield-outline',
  'Debt payment': 'card-outline',
  Childcare: 'people-outline',
  Groceries: 'cart-outline',
  'Gas for car': 'car-outline',
  Household: 'house-outline',
  Medical: 'medical-outline',
  Personal: 'person-outline',
};

@Component({
  selector: 'app-add-category-sheet',
  templateUrl: './add-category-sheet.component.html',
  styleUrls: ['./add-category-sheet.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonInput,
  ],
})
export class AddCategorySheetComponent {
  @Input() type: 'income' | 'bills' | 'flexible' = 'income';
  @Input() suggestedNames: string[] = [];

  customName = '';

  constructor(private modalCtrl: ModalController) {}

  get header(): string {
    return this.type === 'income' ? 'Add income' : this.type === 'bills' ? 'Add bill' : 'Add flexible';
  }

  get placeholder(): string {
    return this.type === 'income'
      ? 'Create custom income'
      : this.type === 'bills'
        ? 'Create custom bill'
        : 'Create custom flexible';
  }

  getIcon(name: string): string {
    return CATEGORY_ICON_MAP[name] ?? 'ellipse-outline';
  }

  selectSuggested(name: string) {
    this.modalCtrl.dismiss({ name, isCustom: false });
  }

  addCustom() {
    const name = this.customName.trim();
    if (name) {
      this.modalCtrl.dismiss({ name, isCustom: true });
    }
  }

  close() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
