import { Injectable } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { GoogleMapsLoaderService } from './google-maps-loader.service';

declare var google: any;

/** Improves geocode hits for this affiliate when street-only or ambiguous strings are used. */
const TENANT_GEOCODE_SUFFIX = ', Newberg, OR, USA';

/**
 * Shared geocoding used by donation/partner location map modals and the partner churches map.
 * Matches strategies in DonationLocationMapModalComponent (Google Geocoder + Nominatim fallback).
 */
@Injectable({ providedIn: 'root' })
export class AddressGeocodingService {
  constructor(private readonly googleMapsLoader: GoogleMapsLoaderService) {}

  /** Strips HTML and normalizes newlines (CMS/API may include markup). */
  normalizeForGeocode(raw: string): string {
    const noTags = raw.replace(/<[^>]+>/g, ' ');
    return noTags
      .replace(/\r\n|\n|\r/g, ', ')
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/^[\s,]+|[\s,]+$/g, '')
      .trim();
  }

  private geocodeGooglePromise(address: string): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address, region: 'us' }, (results: any[] | null, status: string) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
          const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
          resolve({ lat, lng });
          return;
        }
        if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
          console.warn('AddressGeocoding: Google Geocoder', status, address);
        }
        resolve(null);
      });
    });
  }

  private async geocodeNominatimUs(query: string): Promise<{ lat: number; lng: number } | null> {
    const q = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=us`;
    try {
      const { status, data } = await CapacitorHttp.get({
        url,
        headers: {
          'User-Agent': 'LoveINCMobile/1.0 (Grovlink; nonprofit app)',
          Accept: 'application/json',
        },
      });
      if (status !== 200) return null;
      const rows = typeof data === 'string' ? (JSON.parse(data) as unknown) : data;
      if (!Array.isArray(rows) || !rows[0]) return null;
      const r = rows[0] as { lat?: string; lon?: string };
      const lat = r.lat != null ? parseFloat(r.lat) : NaN;
      const lng = r.lon != null ? parseFloat(r.lon) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      return { lat, lng };
    } catch (e) {
      console.warn('AddressGeocoding: Nominatim request failed', e);
      return null;
    }
  }

  /**
   * Resolves a free-text address to coordinates. Loads the Maps JS API if needed.
   * @returns null if geocoding fails or address is unusable after normalization.
   */
  async resolveLatLng(rawAddress: string): Promise<{ lat: number; lng: number } | null> {
    const normalized = this.normalizeForGeocode(rawAddress ?? '');
    if (!normalized) return null;

    try {
      await this.googleMapsLoader.load();
    } catch (err) {
      console.warn('AddressGeocoding: Google Maps failed to load', err);
    }

    let pos = await this.geocodeGooglePromise(normalized);
    if (pos) return pos;
    if (!/\b(OR|Oregon|97132)\b/i.test(normalized) && !normalized.includes(TENANT_GEOCODE_SUFFIX)) {
      pos = await this.geocodeGooglePromise(normalized + TENANT_GEOCODE_SUFFIX);
      if (pos) return pos;
    }
    let osm = await this.geocodeNominatimUs(normalized);
    if (osm) return osm;
    if (!/\b(OR|Oregon|97132)\b/i.test(normalized) && !normalized.includes(TENANT_GEOCODE_SUFFIX)) {
      osm = await this.geocodeNominatimUs(normalized + TENANT_GEOCODE_SUFFIX);
    }
    return osm;
  }
}
