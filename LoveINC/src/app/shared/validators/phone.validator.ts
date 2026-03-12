import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates US phone format: (123) 456-7890 or 10 digits.
 */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || String(value).trim() === '') {
      return null;
    }
    const digits = String(value).replace(/\D/g, '');
    if (digits.length !== 10) {
      return { phone: { message: 'Phone must be 10 digits' } };
    }
    return null;
  };
}
