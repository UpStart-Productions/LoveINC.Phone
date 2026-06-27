import { Injectable } from '@angular/core';

const MAPS_API_KEY = 'AIzaSyDj0VtmgGeaoJAuMOX94MZT5trhlbLh1Xw';
const MAPS_SCRIPT_URL = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`;

/**
 * **GCP:** In the same project as this key, enable **Maps JavaScript API** (this script) and
 * **Geocoding API** (required for `google.maps.Geocoder`; otherwise the geocoder returns
 * `REQUEST_DENIED`). The map modal also falls back to Nominatim if Google geocoding fails.
 */
@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private loadPromise: Promise<void> | null = null;

  /**
   * Load Google Maps script on demand. Resolves when google.maps is available.
   * Reuses the same promise if already loading/loaded.
   */
  load(): Promise<void> {
    const g = (window as unknown as { google?: { maps?: unknown } }).google;
    if (g && typeof g.maps !== 'undefined') {
      return Promise.resolve();
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = new Promise<void>((resolve, reject) => {
      const callbackName = `__googleMapsCallback_${Date.now()}`;
      (window as unknown as Record<string, () => void>)[callbackName] = () => {
        delete (window as unknown as Record<string, unknown>)[callbackName];
        resolve();
      };
      const script = document.createElement('script');
      script.src = `${MAPS_SCRIPT_URL}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        delete (window as unknown as Record<string, unknown>)[callbackName];
        reject(new Error('Failed to load Google Maps script'));
      };
      document.head.appendChild(script);
    });
    return this.loadPromise;
  }
}
