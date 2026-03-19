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
    IonBackButton,
    IonButtons,
    ContentCardComponent,
  ],
})
export class ToolsPage {
  toolCards: ToolCard[] = REGISTERED_TOOL_CARDS;
}
