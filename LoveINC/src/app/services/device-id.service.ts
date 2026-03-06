import { Injectable } from '@angular/core';

const STORAGE_KEY = 'loveinc_device_id';

/** Generate a UUID v4 for device identification. Persisted for anonymous user deduplication. */
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Injectable({ providedIn: 'root' })
export class DeviceIdService {
  private cached: string | null = null;

  /** Get or create a persistent device ID for this app install. */
  getDeviceId(): string {
    if (this.cached) return this.cached;
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id?.trim()) {
        id = generateUuid();
        localStorage.setItem(STORAGE_KEY, id);
      }
      this.cached = id;
      return id;
    } catch {
      const fallback = generateUuid();
      this.cached = fallback;
      return fallback;
    }
  }
}
