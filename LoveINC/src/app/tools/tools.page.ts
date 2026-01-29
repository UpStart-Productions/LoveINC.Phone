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
      category: 'Guided Scripture',
      categoryIcon: 'water-outline',
      categoryExtra: '0',
      title: 'Worship Over Worry',
      detail: '2-5 min',
      imageUrl: 'assets/photos/love-inc-1.webp',
    },
    {
      category: 'Guided Prayer',
      title: 'God is ready to hear and help.',
      detail: '4-6 min',
      iconName: 'hand-left-outline',
      iconBackgroundColor: '#8b7355',
    },
    {
      category: 'Daily Devotional',
      categoryIcon: 'checkmark-done-outline',
      categoryExtra: 'Day 5',
      title: 'Having Faith That Moves Mountains',
      imageUrl: 'assets/photos/impact-1.jpg',
    },
  ];
}
