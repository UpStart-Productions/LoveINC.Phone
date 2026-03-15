import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { phoneValidator } from './phone.validator';

/**
 * Template directive for US phone validation. Add to ion-input: [appPhoneValidator].
 * Expects 10 digits (works with appPhoneFormatter formatted value).
 */
@Directive({
  selector: '[appPhoneValidator]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: PhoneValidatorDirective, multi: true },
  ],
  standalone: true,
})
export class PhoneValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    return phoneValidator()(control);
  }
}
