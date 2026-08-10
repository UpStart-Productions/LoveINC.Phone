import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { ContentCardComponent } from '../components/content-card/content-card.component';
import { OriginBackButtonComponent } from '../components/origin-back-button/origin-back-button.component';
import { REGISTERED_TOOL_CARDS, type ToolCard } from '../registered-tools';

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
    IonButtons,
    ContentCardComponent,
    OriginBackButtonComponent,
  ],
})
export class ToolsPage {
  toolCards: ToolCard[] = REGISTERED_TOOL_CARDS;

  toolRoute(card: ToolCard): string | undefined {
    if (!card.route) return undefined;
    const [path, query = ''] = card.route.split('?');
    const normalizedPath =
      path === '/tabs/simple-budget'
        ? '/tabs/simple-budget/weekly'
        : path === '/tabs/goal-tracker'
          ? '/tabs/goal-tracker/goals'
          : path;
    const params = new URLSearchParams(query);
    params.set('from', 'tools');
    const qs = params.toString();
    return qs ? `${normalizedPath}?${qs}` : `${normalizedPath}?from=tools`;
  }
}
