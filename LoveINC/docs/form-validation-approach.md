# Form Validation Approach

**Preference:** Always add validations incrementally. Never add default validations to any form.

## Principles

1. **No default invalid state** – Forms must not show invalid styling by default.
2. **Explicit opt-in only** – Only fields with custom validators (e.g. phone, email) show invalid state. Add `[class.ion-invalid]` manually.
3. **No submit-triggered validation UI** – Do not show validation errors when the user submits a blank form.
4. **Incremental additions** – When adding validation to a new field, add the validator and the explicit invalid-state binding together.

## Implementation

- See `.cursor/rules/form-validation.mdc` for AI guidance.
- Contact form (`contact-assistance-form`) is the reference: only Phone and Email show invalid state (custom validators).
