# @upstart-productions/goal-tracker

Angular/Ionic Goal Tracker – set and track personal goals with SQLite storage.

## Installation

```bash
npm install @upstart-productions/goal-tracker @capacitor-community/sqlite jeep-sqlite
```

## Setup

### 1. Initialize jeep-sqlite (web/PWA)

In your app's `app.component.ts`, initialize jeep-sqlite for web:

```typescript
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

// In ngOnInit, when NOT on native:
if (!this.platform.is('capacitor')) {
  jeepSqlite(window);
  const jeepEl = document.createElement('jeep-sqlite');
  document.body.appendChild(jeepEl);
  await customElements.whenDefined('jeep-sqlite');
}
```

### 2. Add route

Love INC hosts Goal Tracker in the app shell (`goal-tracker-tabs.page` under `src/app/goal-tracker-tabs/`). Register that page in your routes — see `registered-tools.ts` in this repo. This package exports services, types, and DB access only.

### 3. iOS: CocoaPods required

`@capacitor-community/sqlite` requires CocoaPods. If your app uses SPM (Capacitor 8 default), migrate to CocoaPods:

```bash
rm -rf ios
npx cap add ios --packagemanager CocoaPods
```

Then add `CapacitorCommunitySqlite` to `ios/App/Podfile` (see UpStart Podfile for reference). Run `pod install` in `ios/App` and open `App.xcworkspace`.

### 4. Theme (optional)

Override CSS vars in your theme (e.g. `variables.scss`):

```scss
:root {
  --goal-tracker-primary: var(--ion-text-color);
  --goal-tracker-secondary: var(--ion-color-medium);
  --goal-tracker-success: var(--ion-color-success);
  --goal-tracker-accent: var(--ion-color-primary);
}
```

## Usage

Navigate to `/tabs/goal-tracker` (or your configured path). Add goals via the FAB, toggle completion, and delete as needed.

## Local development

```bash
# From LoveINC root
npm run build:goal-tracker
```

Use `"@upstart-productions/goal-tracker": "file:packages/goal-tracker"` in `package.json` for local linking.
