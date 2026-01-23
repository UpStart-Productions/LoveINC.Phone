import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-developer-options',
  templateUrl: 'developer-options.page.html',
  styleUrls: ['developer-options.page.scss'],
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent,
    IonBackButton,
    IonButtons,
    LucideAngularModule
  ],
})
export class DeveloperOptionsPage {
  // Array of 20 Lucide icons to display
  icons = [
    { name: 'heart', label: 'Heart' },
    { name: 'star', label: 'Star' },
    { name: 'home', label: 'Home' },
    { name: 'user', label: 'User' },
    { name: 'settings', label: 'Settings' },
    { name: 'bell', label: 'Bell' },
    { name: 'mail', label: 'Mail' },
    { name: 'phone', label: 'Phone' },
    { name: 'map', label: 'Map' },
    { name: 'calendar', label: 'Calendar' },
    { name: 'file-text', label: 'File Text' },
    { name: 'image', label: 'Image' },
    { name: 'video', label: 'Video' },
    { name: 'music', label: 'Music' },
    { name: 'search', label: 'Search' },
    { name: 'filter', label: 'Filter' },
    { name: 'download', label: 'Download' },
    { name: 'upload', label: 'Upload' },
    { name: 'share', label: 'Share' },
    { name: 'check', label: 'Check' }
  ];
}
