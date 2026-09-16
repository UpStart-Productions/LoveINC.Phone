// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {
  localGrovLinkApiBaseUrl,
  localGrovLinkYoutubeEmbedBaseUrl,
} from './local-grovlink-url';

/** Flip to false when done testing against local GrovLink. */
const USE_LOCAL_GROVLINK = true;

export const environment = {
  production: false,
  apiBaseUrl: USE_LOCAL_GROVLINK
    ? localGrovLinkApiBaseUrl()
    : 'https://api.grovlink.com/api',
  youtubeEmbedBaseUrl: USE_LOCAL_GROVLINK
    ? localGrovLinkYoutubeEmbedBaseUrl()
    : 'https://api.grovlink.com/embed',
  /** Generate in local GrovLink admin if requests fail with 401. */
  apiKey: 'npmp_q-ajDhD2sB4O4yy5e-m3PcXflfrePITRv9EhGiGXYXU',
  /** Customer slug (e.g. loveinc) */
  customerSlug: 'loveinc',
  /** Tenant/affiliate slug (e.g. newberg) */
  tenantSlug: 'newberg',
  /**
   * App Store listing URL (More → Rate / Share on iOS).
   */
  iosAppStoreListingUrl:
    'https://apps.apple.com/us/app/love-inc-newberg/id6762418617',
  /**
   * Play Store listing URL (More → Share on Android; also used for Rate on Android).
   */
  androidPlayStoreListingUrl:
    'https://play.google.com/store/apps/details?id=org.loveincnewberg.app',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
