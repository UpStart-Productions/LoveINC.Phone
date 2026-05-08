import { Injectable } from '@angular/core';
import appVersion from '../../app-version.json';

export interface AppVersionSnapshot {
  version: string;
  build: number;
  lastUpdated: string;
  /** e.g. v1.0.1 */
  displayVersion: string;
  /** User-facing line including build */
  displayFull: string;
}

@Injectable({ providedIn: 'root' })
export class AppVersionService {
  /** Values baked in at build time from src/app-version.json */
  readonly snapshot: AppVersionSnapshot = {
    version: appVersion.version,
    build: appVersion.build,
    lastUpdated: appVersion.lastUpdated,
    displayVersion: `v${appVersion.version}`,
    displayFull: `v${appVersion.version} (${appVersion.build})`,
  };
}
