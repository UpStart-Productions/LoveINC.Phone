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
}
