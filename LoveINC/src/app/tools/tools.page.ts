import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import { REGISTERED_TOOL_CARDS, type ToolCard } from '../registered-tools';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    ContentCardListComponent,
    AppBackButtonComponent,
  ],
})
export class ToolsPage {
  toolCards: ToolCard[] = REGISTERED_TOOL_CARDS;

  get toolListItems(): ContentCardListItem[] {
    return this.toolCards.map((card) => ({
      title: card.title,
      category: card.category,
      categoryIcon: card.categoryIcon,
      categoryExtra: card.categoryExtra,
      detail: card.detail,
      imageUrl: card.imageUrl,
      iconName: card.iconName,
      iconBackgroundColor: card.iconBackgroundColor,
      route: card.route,
    }));
  }
}
