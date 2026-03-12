import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates email format: requires @ symbol and a valid domain extension (2+ char TLD).
 * Examples: user@example.com, name@org.co.uk
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || String(value).trim() === '') {
      return null;
    }
    const str = String(value).trim();
    if (!str.includes('@')) {
      return { email: { message: 'Email must contain @' } };
    }
    const parts = str.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { email: { message: 'Invalid email format' } };
    }
    const domain = parts[1];
    if (!domain.includes('.')) {
      return { email: { message: 'Email must have a domain extension (e.g. .com)' } };
    }
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) {
      return { email: { message: 'Domain extension must be at least 2 characters' } };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(str)) {
      return { email: { message: 'Please enter a valid email address' } };
    }
    return null;
  };
}
