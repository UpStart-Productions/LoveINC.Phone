import { Directive, HostListener, ElementRef, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Formats phone input as (123) 456-7890 as the user types.
 * Only allows digits; formats to US format when 10 digits or less.
 */
@Directive({
  selector: 'ion-input[appPhoneFormatter]',
  standalone: true,
})
export class PhoneFormatterDirective {
  constructor(
    private el: ElementRef<HTMLIonInputElement>,
    @Optional() @Self() private ngControl: NgControl,
  ) {}

  @HostListener('ionInput', ['$event'])
  onInput(event: CustomEvent<{ value: string }>): void {
    const value = event.detail?.value ?? (event.target as HTMLIonInputElement).value ?? '';
    const digits = String(value).replace(/\D/g, '').slice(0, 10);
    const formatted = this.formatPhone(digits);
    if (formatted !== value) {
      const input = event.target as HTMLIonInputElement;
      input.value = formatted;
      this.ngControl?.control?.setValue(formatted, { emitEvent: false });
    }
  }

  private formatPhone(digits: string): string {
    if (digits.length <= 3) {
      return digits ? `(${digits}` : '';
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
}
