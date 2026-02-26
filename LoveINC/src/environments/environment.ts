// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  /** Nonprofit Mobile Platform API base URL (no trailing slash). Use /api in dev so the dev proxy forwards to api.grovlink.com and avoids CORS. */
  apiBaseUrl: '/api',
  /** API key from admin (API Keys or Mobile App Config → API Key tab) */
  apiKey: 'npmp_q-ajDhD2sB4O4yy5e-m3PcXflfrePITRv9EhGiGXYXU',
  /** Customer slug (e.g. loveinc) */
  customerSlug: 'loveinc',
  /** Tenant/affiliate slug (e.g. newberg) */
  tenantSlug: 'newberg',
  /** ESV API key for verse-of-the-day (cross-refs, footnotes). Get one at https://api.esv.org/account/create-application/ */
  esvApiKey: '',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
