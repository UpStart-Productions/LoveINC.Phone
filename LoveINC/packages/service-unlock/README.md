# @upstart-productions/service-unlock

Angular/Ionic Service Unlock – intake QR unlock and voucher management for client access to Gap Ministries.

## Installation

```bash
npm install @upstart-productions/service-unlock @capacitor-community/sqlite @capacitor-mlkit/barcode-scanning jeep-sqlite
```

## Setup

### 1. Initialize jeep-sqlite (web)

In your app's `app.component.ts`, initialize jeep-sqlite for web (same as goal-tracker):

```typescript
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

if (!this.platform.is('capacitor')) {
  jeepSqlite(window);
  // ...
}
```

### 2. Add routes

```typescript
{
  path: 'service-unlock/scan',
  loadComponent: () =>
    import('@upstart-productions/service-unlock').then((m) => m.ServiceUnlockScanPage),
}
```

### 3. Add Service Access section to Profile

When user type is Client, show the Service Access section:

```html
<app-service-access-section *ngIf="selectedUserType === 'client'"></app-service-access-section>
```

Import `ServiceAccessSectionComponent` in your Profile page.

### 4. iOS / Android permissions

**iOS:** Add `NSCameraUsageDescription` to `Info.plist` for QR scanning.

**Android:** Add `android.permission.CAMERA` and ML Kit metadata to `AndroidManifest.xml` (see @capacitor-mlkit/barcode-scanning docs).

### 5. Unlock phrase provider (optional)

When API is ready, provide the unlock phrase:

```typescript
providers: [
  {
    provide: UNLOCK_PHRASE_PROVIDER,
    useValue: {
      getUnlockPhrase: () => platformApi.getMobileConfig().pipe(
        map(c => c.intakeUnlockPhrase)
      ).toPromise()
    }
  }
]
```

Until then, the package uses mock phrase `"Love INC Loves You"`.

## Usage

- **Profile (Client):** Service Access section shows intake status and vouchers. "Scan QR Code" navigates to scan page.
- **Scan page:** User scans QR from intake materials. On match, access is unlocked.
- **Gap Ministries:** When locked, tapping phone on a direct-contact service shows "Intake Required" and option to contact Love INC.

## Local development

```bash
npm run build:service-unlock
```

Use `"@upstart-productions/service-unlock": "file:packages/service-unlock"` for local linking.
