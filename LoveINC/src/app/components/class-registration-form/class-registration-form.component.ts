import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { OnboardingService } from '../../services/onboarding.service';
import { PlatformApiService } from '../../services/platform/platform-api.service';
import { DeviceIdService } from '../../services/device-id.service';
import {
  GrovLinkDatabaseService,
  type ClassRegistrationPayloadForStorage,
} from '../../services/grovlink-database.service';
import {
  PhoneFormatterDirective,
  EmailValidatorDirective,
  PhoneValidatorDirective,
} from '../../shared/validators';

/** US states for mailing address (value = USPS abbreviation). */
export const US_STATE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

@Component({
  selector: 'app-class-registration-form',
  templateUrl: './class-registration-form.component.html',
  styleUrls: ['./class-registration-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButton,
    PhoneFormatterDirective,
    EmailValidatorDirective,
    PhoneValidatorDirective,
  ],
})
export class ClassRegistrationFormComponent implements OnInit {
  /** Platform class id (required). */
  @Input({ required: true }) classId!: string;

  /** Denormalized for GrovLink local history (optional). */
  @Input() classTitle: string | null = null;
  @Input() classScheduleLabel: string | null = null;

  @Output() submitted = new EventEmitter<void>();

  readonly stateOptions = US_STATE_OPTIONS;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressStreet1: '',
    addressStreet2: '',
    addressCity: '',
    addressState: 'OR',
    addressZip: '',
    birthDate: '',
    shuttleNeeded: '' as '' | 'yes' | 'no',
    childrenGoodNewsClub: '' as '' | 'yes' | 'no',
    childrenDetails: '',
    prayerRequests: '',
    additionalInfo: '',
  };

  submitting = false;

  constructor(
    private onboardingService: OnboardingService,
    private platformApi: PlatformApiService,
    private deviceId: DeviceIdService,
    private grovlinkDb: GrovLinkDatabaseService,
    private toastController: ToastController,
  ) {}

  ngOnInit(): void {
    const data = this.onboardingService.getOnboardingData();
    if (data?.firstName) this.form.firstName = data.firstName;
    if (data?.lastName) this.form.lastName = data.lastName;
    if (data?.email) this.form.email = data.email;
  }

  private buildMailingAddress(): string {
    const d = this.form.addressZip.replace(/\D/g, '');
    const zip =
      d.length === 9 ? `${d.slice(0, 5)}-${d.slice(5)}` : d.length === 5 ? d : this.form.addressZip.trim();
    const lines: string[] = [this.form.addressStreet1.trim()];
    if (this.form.addressStreet2.trim()) {
      lines.push(this.form.addressStreet2.trim());
    }
    lines.push(`${this.form.addressCity.trim()}, ${this.form.addressState} ${zip}`);
    return lines.join('\n');
  }

  canSubmit(): boolean {
    if (!this.classId?.trim()) return false;
    const zipDigits = this.form.addressZip.replace(/\D/g, '');
    if (zipDigits.length !== 5 && zipDigits.length !== 9) return false;

    if (
      !this.form.firstName.trim() ||
      !this.form.lastName.trim() ||
      !this.form.email.trim() ||
      !this.form.addressStreet1.trim() ||
      !this.form.addressCity.trim() ||
      !this.form.addressState?.trim() ||
      !this.form.birthDate.trim() ||
      !this.form.shuttleNeeded ||
      !this.form.childrenGoodNewsClub
    ) {
      return false;
    }
    const emailValid = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(this.form.email.trim());
    if (!emailValid) return false;
    const digits = this.form.phone.replace(/\D/g, '');
    if (digits.length !== 10) return false;
    return true;
  }

  getEmailError(control: unknown): string {
    const c = control as {
      errors?: Record<string, { message?: string }> | null;
      invalid?: boolean;
      touched?: boolean;
    };
    if (!c?.invalid || !c?.touched) return '';
    return c.errors?.['email']?.message ?? 'Please enter a valid email address';
  }

  getPhoneError(control: unknown): string {
    const c = control as {
      errors?: Record<string, { message?: string }> | null;
      invalid?: boolean;
      touched?: boolean;
    };
    if (!c?.invalid || !c?.touched) return '';
    return c.errors?.['phone']?.message ?? 'Phone must be 10 digits';
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit() || this.submitting) return;
    this.submitting = true;
    try {
      const phoneDigits = this.form.phone.replace(/\D/g, '');
      const answers: Record<string, string | boolean> = {
        shuttleNeeded: this.form.shuttleNeeded === 'yes',
        childrenInGoodNewsClub: this.form.childrenGoodNewsClub === 'yes',
      };
      const childrenDetails = this.form.childrenDetails?.trim();
      if (childrenDetails) answers['childrenDetails'] = childrenDetails;
      const prayerRequests = this.form.prayerRequests?.trim();
      if (prayerRequests) answers['prayerRequests'] = prayerRequests;
      const additionalInfo = this.form.additionalInfo?.trim();
      if (additionalInfo) answers['additionalInfo'] = additionalInfo;

      const registrationPayload: ClassRegistrationPayloadForStorage = {
        classId: this.classId,
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        email: this.form.email.trim(),
        phone: phoneDigits,
        mailingAddress: this.buildMailingAddress(),
        birthDate: this.form.birthDate.trim(),
        answers,
        deviceId: this.deviceId.getDeviceId(),
      };
      const res = await this.platformApi.postClassRegistration(registrationPayload);
      const serverId = res?.id?.trim();
      if (serverId) {
        try {
          await this.grovlinkDb.saveClassRegistration({
            serverId,
            classId: this.classId,
            classTitle: this.classTitle?.trim() || null,
            classScheduleLabel: this.classScheduleLabel?.trim() || null,
            payload: registrationPayload,
          });
        } catch (localErr) {
          console.warn('Class registration saved on server but GrovLink local save failed', localErr);
        }
      }
      this.submitted.emit();
    } catch (err) {
      const httpErr = err as {
        status?: number;
        error?: { message?: string | string[] };
        message?: string;
      };
      let msg =
        (Array.isArray(httpErr?.error?.message)
          ? httpErr.error.message.join(', ')
          : httpErr?.error?.message) ??
        httpErr?.message ??
        'Something went wrong. Please try again.';
      if (httpErr?.status === 409) {
        msg = 'You are already registered for this class.';
      }
      const toast = await this.toastController.create({
        message: msg,
        duration: 5000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle',
      });
      await toast.present();
    } finally {
      this.submitting = false;
    }
  }
}
