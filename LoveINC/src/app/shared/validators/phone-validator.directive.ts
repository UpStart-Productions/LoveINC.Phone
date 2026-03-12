import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { phoneValidator } from './phone.validator';

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
