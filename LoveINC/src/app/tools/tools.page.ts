import { HeaderActionsComponent } from '../components/header-actions/header-actions.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButtons,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import { ContentPlanService } from '../content-plan/content-plan.service';
import { mapContentPlanThemeToLearnListItem } from '../content-plan/content-plan.mapper';
import { PlatformApiService } from '../services/platform';
import { REGISTERED_TOOL_CARDS, type ToolCard } from '../registered-tools';
import { resolveAvatarBackgroundColor } from '../shared/utils/avatar-palette.util';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.page.html',
  standalone: true,
  imports: [
    IonButtons, HeaderActionsComponent,
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
  private readonly platformApi = inject(PlatformApiService);

  listItems: ContentCardListItem[] = [];
  private readonly staticToolCards: ToolCard[] = REGISTERED_TOOL_CARDS;

  /** Permanent top row — browse all transformational classes. */
  private readonly classesListItem: ContentCardListItem = {
    id: 'transformation-classes',
    title: 'View Upcoming Classes',
    category: 'Transformational Classes',
    lucideCategoryIcon: 'graduation-cap',
    lucideIcon: 'graduation-cap',
    iconBackgroundColor: resolveAvatarBackgroundColor('transformation-classes'),
    compactCategoryLabel: true,
    route: '/tabs/transformation-classes',
    navigationFrom: 'tools',
  };

  private readonly compassionListItem: ContentCardListItem = {
    id: 'redemptive-compassion',
    title: 'What is Redemptive Compassion',
    category: 'Transformational Ministry',
    lucideCategoryIcon: 'heart',
    lucideIcon: 'heart',
    iconBackgroundColor: '#244d9f',
    compactCategoryLabel: true,
    route: '/tabs/redemptive-compassion',
    navigationFrom: 'tools',
  };

  ngOnInit(): void {
    this.loadItems();
  }

  ionViewWillEnter(): void {
    this.loadItems(true);
  }

  private loadItems(refresh = false): void {
    this.listItems = [this.classesListItem, this.compassionListItem, ...this.staticToolCards.map((card) => this.mapToolCard(card))];
    this.contentPlanService.getThemes(refresh).subscribe({
      next: (themes) => {
        const themeItems = themes.map((theme) =>
          mapContentPlanThemeToLearnListItem(theme, (path) =>
            this.platformApi.resolveUploadUrl(path),
          ),
        );
        const toolItems = this.staticToolCards.map((card) => this.mapToolCard(card));
        this.listItems = [this.classesListItem, this.compassionListItem, ...themeItems, ...toolItems];
      },
      error: (err) => {
        console.error('Error loading Learn themes:', err);
        this.listItems = [this.classesListItem, this.compassionListItem, ...this.staticToolCards.map((card) => this.mapToolCard(card))];
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
