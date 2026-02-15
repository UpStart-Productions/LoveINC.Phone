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

## Endpoints (incremental)

| Endpoint | Status | Used by |
|----------|--------|---------|
| `GET /classes` | ✅ Wired | Transformation Classes page |
| `GET /events` | Planned | Updates page |
| `GET /services` | Planned | Gap Ministries, Services |
| `GET /ctas` | Planned | Home, CTAs |
| `GET /home-feed` | Planned | Home page |
| `GET /branding` | Planned | App shell (colors, logo) |
| `GET /navigation` | Planned | Tab bar config |
| `GET /organization` | Planned | About, contact |

## Adding More Endpoints

1. Add the method to `PlatformApiService` (`src/app/services/platform-api.service.ts`)
2. Add response types if needed
3. Update the page to use the service instead of `HttpClient.get('assets/data/...')`
4. Map API response to existing models

## Fallback When API Key Missing

If `apiKey` is empty, `PlatformApiService` returns empty arrays and logs a console warning. This lets the app run without the platform (e.g. for UI development).
