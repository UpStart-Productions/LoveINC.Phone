# Platform API Integration

This app connects to the **Nonprofit Mobile Platform** public API for content (classes, events, services, etc.).

## Quick Start

1. Start the platform: `cd /path/to/Nonprofit.Mobile.Platform && npm run dev`
2. Generate an API key in the admin (API Keys page or Mobile App Config → API Key tab)
3. Paste the key into `src/environments/environment.ts` → `apiKey`
4. Run this app: `npm start`
5. Open Transformation Classes — it should load from the API

## Setup

1. **Get an API key** from the platform admin:
   - Log in as super admin or customer admin
   - Go to **API Keys** (super) or **Mobile App Config → API Key** tab (customer admin)
   - Generate a key and copy it (shown once)

2. **Configure** `src/environments/environment.ts`:
   ```ts
   apiBaseUrl: 'http://localhost:3000/api',  // or production URL
   apiKey: 'npmp_xxxx...',                   // paste your key
   customerSlug: 'loveinc',
   tenantSlug: 'newberg',
   ```

3. **Run the platform** (`npm run dev` in the platform repo) so the API is available.

## API Details

- **Auth:** Send `x-api-key` header on every request
- **Path pattern:** `/public/{customerSlug}/{tenantSlug}/{resource}`
- **Base URL:** `{apiBaseUrl}/public/{customerSlug}/{tenantSlug}`

## Service Layer

The abstracted service layer lives in `src/app/services/platform/`:

- **`types.ts`** — All `Platform*` interfaces aligned with the API
- **`platform-api.service.ts`** — Single service with methods for each endpoint

Import from `'../../services/platform'` or `'../../services/platform-api.service'` (legacy).

## Endpoints

| Endpoint | Status | Method | Used by |
|----------|--------|--------|---------|
| `GET /organization` | ✅ | `getOrganization()` | About, contact |
| `GET /events` | ✅ | `getEvents()` | Updates page |
| `GET /classes` | ✅ | `getClasses()` | Transformation Classes page |
| `GET /plans` | ✅ (platform) | `getPlans()` | Content plans (`/tabs/content-plan/:planKey`) |
| `GET /moments` | ✅ (platform) | — | Standalone moments catalog (not wired in app yet) |
| `GET /services` | ✅ | `getServices()` | Gap Ministries, Services |
| `GET /ctas` | ✅ | `getCtas()` | Home, CTAs |
| `GET /impact-stories` | ✅ | `getImpactStories()` | Impact Stories page |
| `GET /home-feed` | ✅ | `getHomeFeed()` | Home page |
| `POST /intake/validate` | ✅ | `validateIntakePhrase()` | Service unlock (QR scan) |

## Home Feed

The home feed supports two modes:

1. **Curated** — When the admin has added items via the Home Feed dashboard widget, those items are returned in the specified order.
2. **Auto** — When no items are curated, the feed is built automatically from events, classes, CTAs, and impact stories.

## Adding More Endpoints

1. Add the interface to `src/app/services/platform/types.ts`
2. Add the method to `PlatformApiService` (`src/app/services/platform/platform-api.service.ts`)
3. Update the page to use the service instead of `HttpClient.get('assets/data/...')`
4. Map API response to existing models

## Fallback When API Key Missing

If `apiKey` is empty, `PlatformApiService` returns empty arrays/null and logs a console warning. This lets the app run without the platform (e.g. for UI development).
