# Shared Utilities

Reusable utilities, validators, pipes, and models used across the Love INC app. **Check here before implementing similar functionality** to avoid reinventing the wheel.

## Quick Reference

| Need | Use | Import from |
|------|-----|-------------|
| Email validation | `emailValidator()` or `appEmailValidator` directive | `@app/shared/validators` |
| Phone validation | `phoneValidator()` or `appPhoneValidator` directive | `@app/shared/validators` |
| Phone formatting (123) 456-7890 | `appPhoneFormatter` directive | `@app/shared/validators` |
| Render HTML with custom elements (ion-icon) | `SafeHtmlPipe` | `@app/shared/pipes` |
| Trusted URLs (YouTube embed, etc.) | `SafeResourceUrlPipe` | `@app/shared/pipes` |
| Home card types, labels, icons, colors | `HomeCard`, `CardTypeLabels`, etc. | `@app/shared/models` |
| Time range display (8:30-9:30 PM) | `formatTimeRangeCompact` | `@app/shared/utils` |
| Event date display (Thu, May 21, 6-8pm) | `formatEventDatesCompact` | `@app/shared/utils` |
| Date range without times | `formatDateRangeCompact` | `@app/shared/utils` |
| Parse API time string to compact | `formatTimeStringCompact` | `@app/shared/utils` |
| Map push notification to content route | `mapNotificationMetaToContentType` | `@app/shared/utils` |

---

## Validators (`validators/`)

### Form Validators (reactive forms)

- **`emailValidator()`** – Validates email format: requires `@`, domain, and 2+ char TLD. Use in `Validators.compose()` or as a standalone validator.
- **`phoneValidator()`** – Validates US phone: exactly 10 digits (accepts formatted `(123) 456-7890`).

### Directives (template-driven or reactive)

- **`appEmailValidator`** – Add to `ion-input` for email validation.
- **`appPhoneValidator`** – Add to `ion-input` for phone validation.
- **`appPhoneFormatter`** – Formats input as `(123) 456-7890` as user types. Use on `ion-input[appPhoneFormatter]`.

**Example (reactive form):**
```typescript
import { emailValidator, phoneValidator } from '@app/shared/validators';

this.form = this.fb.group({
  email: ['', [Validators.required, emailValidator()]],
  phone: ['', [Validators.required, phoneValidator()]],
});
```

**Example (directive):**
```html
<ion-input appPhoneFormatter appPhoneValidator ...></ion-input>
<ion-input appEmailValidator ...></ion-input>
```

---

## Pipes (`pipes/`)

- **`SafeHtmlPipe`** – Bypasses Angular HTML sanitizer for trusted content. Use when rendering HTML that includes custom elements (e.g. `ion-icon`). **Only use with trusted app content, not user input.**
- **`SafeResourceUrlPipe`** – Bypasses URL sanitizer for trusted URLs (e.g. YouTube iframe `src`). **Only use with trusted URLs from app code.**

**Example:**
```html
<div [innerHTML]="htmlContent | safeHtml"></div>
<iframe [src]="embedUrl | safeResourceUrl"></iframe>
```

---

## Models (`models/`)

### HomeCard

Types and constants for home screen cards:

- **`CardType`** – Union of card types: `event`, `volunteer`, `donation-drive`, `impact`, `church-partner`, `class`, `gap-ministry`, `donation-opportunity`, `fundraiser`, `awareness`
- **`HomeCard`** – Interface for card data
- **`CardTypeLabels`** – Human-readable labels per type
- **`CardTypeIcons`** – Ionicon names per type
- **`CardTypeColors`** – Brand colors per type (hex)

---

## Utils (`utils/`)

### Date/Time Formatting (`date-time-formatting.ts`)

- **`formatTimeRangeCompact(start, end)`** – Compact time range: `8:30-9:30 PM`, `6 PM` (omits `:00` on the hour)
- **`formatEventDatesCompact(startDate, endDate)`** – Event dates (compact): `Thu, May 21, 6-8pm` or `Thu, May 21 – Fri, May 22, 6-8pm`
- **`formatEventSubtitle(startDate, endDate)`** – Event dates (card/detail): `FRIDAY, March 16, 2026 • 6:00 – 8:00 PM` (single day: no "May 21 – May 21")
- **`formatDateRangeCompact(startDate, endDate)`** – Date range without times: `May 21, 2026` (single day) or `May 21 – May 22, 2026` (multi-day)
- **`formatClassSessionSubtitle(session)`** – Class session: `FR 6:00 – 8:00 PM\nMay 21, 2026`
- **`formatTimeStringCompact(timeStr)`** – Parses API time strings to compact form: `10-12pm`
- **`formatTimeStringFull(timeStr)`** – Parses API time strings to full form: `6:00 – 8:00 PM`
- **`formatTimeRangeFull(start, end)`** – Two time strings to `6:00 – 8:00 PM` (drops redundant AM/PM)
- **`dayTo2Letter(day)`** – `"Friday"` → `"FR"`
- **`dayNumberTo2Letter(n)`** – Day number (0=Sunday) → `"SU"`, `"FR"`, etc.

### Notification Deep Linking (`notification-deeplink.ts`)

- **`mapNotificationMetaToContentType(meta)`** – Maps push/in-app notification `itemType` and `ctaType` to the app’s `ContentType` for routing to content-detail.

---

## Adding New Shared Code

1. Add the implementation in the appropriate subfolder (`validators/`, `pipes/`, `models/`, `utils/`).
2. Export from the subfolder’s `index.ts`.
3. Update this README and the Cursor rule (`.cursor/rules/shared-utilities.mdc`).
