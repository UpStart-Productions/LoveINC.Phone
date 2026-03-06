import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { UserProfileFormComponent, type UserProfileFormValue } from '../user-profile-form/user-profile-form.component';

@Component({
  selector: 'app-user-profile-form-modal',
  templateUrl: './user-profile-form-modal.component.html',
  styleUrls: ['./user-profile-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    UserProfileFormComponent,
  ],
})
export class UserProfileFormModalComponent {
  @Input() headerTitle = 'Complete your profile';
  @Input() message = 'Please enter your name and email to continue.';
  @Input() firstName = '';
  @Input() lastName = '';
  @Input() email = '';

  @Output() save = new EventEmitter<UserProfileFormValue>();

  constructor(private modalController: ModalController) {}

  onSave(value: UserProfileFormValue): void {
    this.save.emit(value);
    this.modalController.dismiss(value);
  }

  onCancel(): void {
    this.modalController.dismiss();
  }
}
