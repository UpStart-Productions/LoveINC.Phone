import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import type { RecipeNutritionFact } from '@upstart-productions/meal-planner';
import {
  formatNutritionAmount,
  isNutritionAmountHigh,
} from '../../utils/myplate-nutrition.util';

@Component({
  selector: 'app-recipe-nutrition-modal',
  templateUrl: './recipe-nutrition-modal.component.html',
  styleUrls: ['./recipe-nutrition-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
  ],
})
export class RecipeNutritionModalComponent {
  @Input({ required: true }) facts!: RecipeNutritionFact[];

  constructor(private modalCtrl: ModalController) {}

  nutritionLine(fact: RecipeNutritionFact): string {
    return formatNutritionAmount(fact).trim();
  }

  isAmountHigh(fact: RecipeNutritionFact): boolean {
    return isNutritionAmountHigh(fact);
  }

  close(): void {
    void this.modalCtrl.dismiss();
  }
}
