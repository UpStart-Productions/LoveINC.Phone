import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { ContentCardComponent } from '../components/content-card/content-card.component';

export interface ToolCard {
  category?: string;
  categoryIcon?: string;
  categoryExtra?: string;
  title: string;
  detail?: string;
  imageUrl?: string;
  iconName?: string;
  iconBackgroundColor?: string;
  route?: string;
}

@Component({
  selector: 'app-tools',
  templateUrl: './tools.page.html',
  styleUrls: ['./tools.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    ContentCardComponent,
  ],
})
export class ToolsPage {
  toolCards: ToolCard[] = [
    {
      category: 'Money Management',
      categoryIcon: 'wallet-outline',
      title: 'Simple Budget Planner',
      detail: 'Track income and expenses',
      iconName: 'calculator-outline',
      iconBackgroundColor: '#214491',
    },
    {
      category: 'Transformation Classes',
      categoryIcon: 'school-outline',
      title: 'Mentor Match',
      detail: 'Connect mentors and mentees',
      iconName: 'people-circle-outline',
      iconBackgroundColor: '#349394',
    },
    {
      category: 'Life Skills',
      categoryIcon: 'restaurant-outline',
      title: 'Meal Planning Tool',
      detail: 'Plan meals and save money',
      iconName: 'restaurant-outline',
      iconBackgroundColor: '#d56132',
    },
    {
      category: 'Spiritual Growth',
      categoryIcon: 'book-outline',
      title: 'Prayer Journal',
      detail: 'Record prayers and reflections',
      iconName: 'book-outline',
      iconBackgroundColor: '#2c5f7d',
    },
    {
      category: 'Life Skills',
      categoryIcon: 'trophy-outline',
      title: 'Goal Tracker',
      detail: 'Set and track personal goals',
      iconName: 'trophy-outline',
      iconBackgroundColor: '#eaa535',
      route: '/tabs/goal-tracker',
    },
  ];
}
