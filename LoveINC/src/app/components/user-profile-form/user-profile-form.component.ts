import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
} from '@ionic/angular/standalone';

export interface UserProfileFormValue {
  firstName: string;
  lastName: string;
  email: string;
}

@Component({
  selector: 'app-user-profile-form',
  templateUrl: './user-profile-form.component.html',
  styleUrls: ['./user-profile-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
  ],
})
export class UserProfileFormComponent {
  @Input() firstName = '';
  @Input() lastName = '';
  @Input() email = '';
  @Input() saveLabel = 'Save';
  @Input() showCancel = false;

  @Output() save = new EventEmitter<UserProfileFormValue>();
  @Output() cancel = new EventEmitter<void>();

  submitting = false;

  get canSave(): boolean {
    const fn = this.firstName?.trim() ?? '';
    const ln = this.lastName?.trim() ?? '';
    const em = this.email?.trim() ?? '';
    return fn.length > 0 && ln.length > 0 && this.isValidEmail(em);
  }

  onSubmit(): void {
    if (!this.canSave || this.submitting) return;
    this.submitting = true;
    const fn = this.firstName.trim();
    const ln = this.lastName.trim();
    const em = this.email.trim();
    this.save.emit({ firstName: fn, lastName: ln, email: em });
    this.submitting = false;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
