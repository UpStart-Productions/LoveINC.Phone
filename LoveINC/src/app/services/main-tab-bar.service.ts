import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/** Lets a page temporarily hide the main app tab bar (e.g. content-plan multi-page nav). */
@Injectable({ providedIn: 'root' })
export class MainTabBarService {
  private readonly forceHidden$ = new BehaviorSubject(false);

  readonly hiddenOverride$ = this.forceHidden$.asObservable();

  isForceHidden(): boolean {
    return this.forceHidden$.value;
  }

  setForceHidden(hidden: boolean): void {
    if (this.forceHidden$.value === hidden) return;
    this.forceHidden$.next(hidden);
  }
}
