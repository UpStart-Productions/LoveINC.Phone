import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export interface DeviceInfo {
  platform: string;
  model: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceInfoService {
  private cached: DeviceInfo | null = null;

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (this.cached) return this.cached;
    const platform = Capacitor.getPlatform() ?? 'unknown';
    let model = 'unknown';
    try {
      const info = await Device.getInfo();
      model = info.model ?? info.manufacturer ?? 'unknown';
    } catch {
      model = platform;
    }
    this.cached = { platform, model };
    return this.cached;
  }
}
