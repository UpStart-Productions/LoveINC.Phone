import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GrovLinkDatabaseService } from './grovlink-database.service';

const PREF_KEY = 'home_class_tools_visible';

@Injectable({ providedIn: 'root' })
export class HomeClassToolsPreferenceService {
  private readonly visible$ = new BehaviorSubject(true);

  readonly visibility$ = this.visible$.asObservable();

  constructor(private readonly grovLinkDb: GrovLinkDatabaseService) {
    void this.load();
  }

  isVisible(): boolean {
    return this.visible$.value;
  }

  async setVisible(visible: boolean): Promise<void> {
    await this.grovLinkDb.setAppPreference(PREF_KEY, visible ? 'true' : 'false');
    this.visible$.next(visible);
  }

  private async load(): Promise<void> {
    try {
      const value = await this.grovLinkDb.getAppPreference(PREF_KEY);
      this.visible$.next(value !== 'false');
    } catch {
      // Keep default (shown)
    }
  }
}
