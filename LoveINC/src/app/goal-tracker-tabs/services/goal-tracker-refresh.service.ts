import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GoalTrackerRefreshService {
  private refresh$ = new Subject<void>();

  /** Emit when goals or habits have changed and the Goals page should reload */
  requestRefresh(): void {
    this.refresh$.next();
  }

  get onRefresh(): Subject<void> {
    return this.refresh$;
  }
}
