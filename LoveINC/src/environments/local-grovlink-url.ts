import { Capacitor } from '@capacitor/core';

const LOCAL_GROVLINK_PORT = 3000;

/** Host for local GrovLink when the app runs on a simulator/device (not web). */
function localGrovLinkHost(): string {
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname;
    // Live reload (--external): reuse the dev machine IP already serving the app.
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }
  return Capacitor.getPlatform() === 'android' ? '10.0.2.2' : 'localhost';
}

export function localGrovLinkApiBaseUrl(): string {
  return `http://${localGrovLinkHost()}:${LOCAL_GROVLINK_PORT}/api`;
}

export function localGrovLinkYoutubeEmbedBaseUrl(): string {
  return `http://${localGrovLinkHost()}:${LOCAL_GROVLINK_PORT}/embed`;
}
