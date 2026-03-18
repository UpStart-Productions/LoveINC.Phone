import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GoalTrackerDebugService {
  traces: string[] = [];
  private max = 20;

  trace(msg: string) {
    this.traces = [msg, ...this.traces].slice(0, this.max);
  }

  clear() {
    this.traces = [];
  }
}
