import { Injectable } from '@angular/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

@Injectable({ providedIn: 'root' })
export class GoalTrackerKeyboardService {
  private activeRefs = 0;

  async enter(): Promise<void> {
    this.activeRefs += 1;
    if (this.activeRefs !== 1) {
      return;
    }
    try {
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    } catch {
      // Keyboard plugin unavailable outside native runtime.
    }
  }

  async leave(): Promise<void> {
    this.activeRefs = Math.max(0, this.activeRefs - 1);
    if (this.activeRefs !== 0) {
      return;
    }
    try {
      await Keyboard.setAccessoryBarVisible({ isVisible: false });
      await Keyboard.setResizeMode({ mode: KeyboardResize.None });
    } catch {
      // Keyboard plugin unavailable outside native runtime.
    }
  }
}
