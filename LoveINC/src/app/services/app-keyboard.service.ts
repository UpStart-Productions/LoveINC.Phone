import { Injectable } from '@angular/core';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Shows the native iOS keyboard accessory bar (Done) for all text inputs app-wide.
 * Capacitor hides the accessory bar by default; we re-enable it at startup and
 * before each keyboard open.
 */
@Injectable({ providedIn: 'root' })
export class AppKeyboardService {
  private initialized = false;
  private keyboardShowListener?: PluginListenerHandle;

  async initialize(): Promise<void> {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }
    this.initialized = true;

    await this.enableDismissAccessoryBar();
    this.setupFocusEnterKeyHint();

    try {
      this.keyboardShowListener = await Keyboard.addListener('keyboardWillShow', () => {
        void this.enableDismissAccessoryBar();
      });
    } catch {
      // Keyboard plugin unavailable outside native runtime.
    }
  }

  async enableDismissAccessoryBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
    } catch {
      // Keyboard plugin unavailable outside native runtime.
    }
  }

  async hide(): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur?.();
    try {
      await Keyboard.hide();
    } catch {
      // Keyboard plugin unavailable outside native runtime.
    }
  }

  private setupFocusEnterKeyHint(): void {
    document.addEventListener(
      'focusin',
      (event) => {
        void this.enableDismissAccessoryBar();

        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
          return;
        }
        if (!target.getAttribute('enterkeyhint')) {
          target.setAttribute('enterkeyhint', 'done');
        }
      },
      true
    );
  }

  async destroy(): Promise<void> {
    await this.keyboardShowListener?.remove();
    this.keyboardShowListener = undefined;
    this.initialized = false;
  }
}
