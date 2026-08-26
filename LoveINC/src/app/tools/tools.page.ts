import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import { ContentPlanService } from '../content-plan/content-plan.service';
import { mapContentPlanThemeToLearnListItem } from '../content-plan/content-plan.mapper';
import { REGISTERED_TOOL_CARDS, type ToolCard } from '../registered-tools';
import { resolveAvatarBackgroundColor } from '../shared/utils/avatar-palette.util';

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
    ContentCardListComponent,
  ],
})
export class ToolsPage implements OnInit {
  private readonly contentPlanService = inject(ContentPlanService);

  listItems: ContentCardListItem[] = [];
  private readonly staticToolCards: ToolCard[] = REGISTERED_TOOL_CARDS;

  /** Permanent top row — browse all transformational classes. */
  private readonly classesListItem: ContentCardListItem = {
    id: 'transformation-classes',
    title: 'View Upcoming Classes',
    category: 'Transformational Classes',
    categoryIcon: 'school-outline',
    iconName: 'school-outline',
    iconBackgroundColor: resolveAvatarBackgroundColor('transformation-classes'),
    compactCategoryLabel: true,
    route: '/tabs/transformation-classes',
    navigationFrom: 'tools',
  };

  ngOnInit(): void {
    this.loadItems();
  }

  ionViewWillEnter(): void {
    this.loadItems(true);
  }

  private loadItems(refresh = false): void {
    this.contentPlanService.getThemes(refresh).subscribe({
      next: (themes) => {
        const themeItems = themes.map((theme) => mapContentPlanThemeToLearnListItem(theme));
        const toolItems = this.staticToolCards.map((card) => this.mapToolCard(card));
        this.listItems = [this.classesListItem, ...themeItems, ...toolItems];
      },
      error: (err) => {
        console.error('Error loading Learn themes:', err);
        this.listItems = [this.classesListItem, ...this.staticToolCards.map((card) => this.mapToolCard(card))];
      },
    });
  }

  private mapToolCard(card: ToolCard): ContentCardListItem {
    return {
      title: card.title,
      category: card.category,
      categoryIcon: card.categoryIcon,
      lucideCategoryIcon: card.lucideCategoryIcon,
      categoryExtra: card.categoryExtra,
      detail: card.detail,
      imageUrl: card.imageUrl,
      iconName: card.iconName,
      lucideIcon: card.lucideIcon,
      iconBackgroundColor: card.iconBackgroundColor,
      route: card.route,
    };
  }
}
