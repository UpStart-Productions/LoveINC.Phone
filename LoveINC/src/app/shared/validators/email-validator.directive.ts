import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { emailValidator } from './email.validator';

/**
 * Template directive for email validation. Add to ion-input: [appEmailValidator].
 * Uses the same logic as emailValidator() for reactive forms.
 */
@Directive({
  selector: '[appEmailValidator]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: EmailValidatorDirective, multi: true },
  ],
  standalone: true,
})
export class EmailValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    return emailValidator()(control);
  }
}
