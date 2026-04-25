import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  ModalController,
} from '@ionic/angular/standalone';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-instructor-bio-modal',
  templateUrl: './instructor-bio-modal.component.html',
  styleUrls: ['./instructor-bio-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    SafeHtmlPipe,
  ],
})
export class InstructorBioModalComponent {
  /** Use `instructorName` (not `name`) — `name` breaks Ionic modal `componentProps` binding. */
  @Input() instructorName = 'Instructor';
  @Input() jobTitle = '';
  @Input() notes = '';
  @Input() photoUrl?: string;

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }
}
