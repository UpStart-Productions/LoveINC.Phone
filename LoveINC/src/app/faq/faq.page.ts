import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { FaqService, FAQ } from '../services/faq.service';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.page.html',
  styleUrls: ['./faq.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonSpinner,
    IonIcon,
  ],
})
export class FaqPage implements OnInit {
  faqs: FAQ[] = [];
  loading = true;
  accordionValue: string | null = null;

  constructor(private faqService: FaqService) {}

  ngOnInit(): void {
    this.loadFAQs();
  }

  ionViewWillEnter(): void {
    this.accordionValue = null;
  }

  onAccordionChange(event: Event): void {
    const customEvent = event as CustomEvent;
    this.accordionValue = customEvent.detail?.value ?? null;
  }

  loadFAQs(): void {
    this.faqService.getFAQs().subscribe({
      next: (data) => {
        this.faqs = data ?? [];
      },
      error: (err) => {
        console.error('Failed to load FAQs:', err);
        this.faqs = [];
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
