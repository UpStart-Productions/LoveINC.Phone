import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export interface QuillToolbarState {
  isVisible: boolean;
  keyboardHeight: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isHeader1: boolean;
  boldMode: boolean;
  italicMode: boolean;
  underlineMode: boolean;
  bulletMode: boolean;
  orderedMode: boolean;
  header1Mode: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class QuillToolbarService {
  private activeQuillEditor$ = new BehaviorSubject<any>(null);
  private toolbarState$ = new BehaviorSubject<QuillToolbarState>({
    isVisible: false,
    keyboardHeight: 0,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isBulletList: false,
    isOrderedList: false,
    isHeader1: false,
    boldMode: false,
    italicMode: false,
    underlineMode: false,
    bulletMode: false,
    orderedMode: false,
    header1Mode: false,
  });

  private keyboardHeight = 0;
  private isKeyboardOpen = false;
  private focusOutTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly estimatedKeyboardHeightPx = 300;

  constructor() {
    void this.initializeKeyboardListeners();
    this.attachVisualViewportListener();
  }

  get activeQuillEditor(): Observable<any> {
    return this.activeQuillEditor$.asObservable();
  }

  get toolbarState(): Observable<QuillToolbarState> {
    return this.toolbarState$.asObservable();
  }

  registerQuillEditor(editor: any): void {
    this.activeQuillEditor$.next(editor);
    this.updateToolbarState();
  }

  /**
   * Call when the Quill contenteditable gains focus (e.g. user tapped the field).
   * Shows the bar even if @capacitor/keyboard has not fired yet.
   */
  notifyEditorContentFocus(): void {
    if (this.focusOutTimer) {
      clearTimeout(this.focusOutTimer);
      this.focusOutTimer = null;
    }
    this.isKeyboardOpen = true;
    if (this.keyboardHeight < 1) {
      this.keyboardHeight = this.estimatedKeyboardHeightPx;
    }
    this.updateToolbarState();
  }

  /** Call when the Quill root loses focus. Debounced so toolbar taps (mousedown) do not dismiss the bar. */
  notifyEditorContentBlur(): void {
    this.focusOutTimer = setTimeout(() => {
      this.isKeyboardOpen = false;
      this.keyboardHeight = 0;
      this.updateToolbarState();
    }, 150);
  }

  unregisterQuillEditor(): void {
    this.activeQuillEditor$.next(null);
    this.updateToolbarState();
  }

  executeFormat(format: string, value: any): void {
    const editor = this.activeQuillEditor$.value;
    if (editor) {
      if (format === 'bullet' || format === 'ordered') {
        editor.format('list', value ? format : false);
      } else if (format === 'header1') {
        editor.format('header', value ? 1 : false);
      } else {
        editor.format(format, value);
      }

      setTimeout(() => {
        this.updateFormatState();
        this.syncFormatModes(format, value);
      }, 10);
    }
  }

  updateFormatState(): void {
    const editor = this.activeQuillEditor$.value;
    if (!editor) return;

    try {
      const format = editor.getFormat();
      const currentState = this.toolbarState$.value;
      const newState: QuillToolbarState = {
        ...currentState,
        isBold: !!format.bold,
        isItalic: !!format.italic,
        isUnderline: !!format.underline,
        isBulletList: format.list === 'bullet',
        isOrderedList: format.list === 'ordered',
        isHeader1: format.header === 1,
        boldMode: !!format.bold ? currentState.boldMode : false,
        italicMode: !!format.italic ? currentState.italicMode : false,
        underlineMode: !!format.underline ? currentState.underlineMode : false,
        bulletMode: format.list === 'bullet' ? currentState.bulletMode : false,
        orderedMode: format.list === 'ordered' ? currentState.orderedMode : false,
        header1Mode: format.header === 1 ? currentState.header1Mode : false,
      };

      this.toolbarState$.next(newState);
    } catch {
      // ignore
    }
  }

  private syncFormatModes(_format: string, _value: any): void {
    setTimeout(() => {
      const editor = this.activeQuillEditor$.value;
      if (!editor) return;

      const currentFormat = editor.getFormat();
      const currentState = this.toolbarState$.value;
      const newState: QuillToolbarState = {
        ...currentState,
        isBold: !!currentFormat.bold,
        isItalic: !!currentFormat.italic,
        isUnderline: !!currentFormat.underline,
        isBulletList: currentFormat.list === 'bullet',
        isOrderedList: currentFormat.list === 'ordered',
        isHeader1: currentFormat.header === 1,
        boldMode: false,
        italicMode: false,
        underlineMode: false,
        bulletMode: false,
        orderedMode: false,
        header1Mode: false,
      };

      this.toolbarState$.next(newState);
    }, 20);
  }

  toggleFormatMode(format: string): void {
    const currentState = this.toolbarState$.value;
    const newState: QuillToolbarState = { ...currentState };

    switch (format) {
      case 'bold':
        newState.boldMode = !newState.boldMode;
        break;
      case 'italic':
        newState.italicMode = !newState.italicMode;
        break;
      case 'underline':
        newState.underlineMode = !newState.underlineMode;
        break;
      case 'bullet':
        newState.bulletMode = !newState.bulletMode;
        newState.orderedMode = false;
        break;
      case 'ordered':
        newState.orderedMode = !newState.orderedMode;
        newState.bulletMode = false;
        break;
      case 'header1':
        newState.header1Mode = !newState.header1Mode;
        break;
    }

    this.toolbarState$.next(newState);

    const editor = this.activeQuillEditor$.value;
    if (editor) {
      const key = `${format}Mode` as keyof QuillToolbarState;
      const formatValue = newState[key];
      if (format === 'bullet' || format === 'ordered') {
        editor.format('list', formatValue ? format : false);
      } else if (format === 'header1') {
        editor.format('header', formatValue ? 1 : false, 'user');
      } else {
        editor.format(format, formatValue);
      }
    }
  }

  resetFormatModes(): void {
    const currentState = this.toolbarState$.value;
    const newState: QuillToolbarState = {
      ...currentState,
      boldMode: false,
      italicMode: false,
      underlineMode: false,
      bulletMode: false,
      orderedMode: false,
      header1Mode: false,
    };

    this.toolbarState$.next(newState);

    const editor = this.activeQuillEditor$.value;
    if (editor) {
      editor.format('bold', false);
      editor.format('italic', false);
      editor.format('underline', false);
      editor.format('list', false);
      editor.format('header', false);
    }
  }

  setToolbarVisibility(isVisible: boolean): void {
    if (!isVisible && this.isKeyboardOpen) {
      return;
    }
    const currentState = this.toolbarState$.value;
    this.toolbarState$.next({ ...currentState, isVisible });
  }

  setToolbarState(newState: QuillToolbarState): void {
    this.toolbarState$.next(newState);
  }

  private async initializeKeyboardListeners(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
          this.keyboardHeight = info.keyboardHeight;
          this.isKeyboardOpen = true;
          this.updateToolbarState();
        });
        await Keyboard.addListener('keyboardWillHide', () => {
          this.keyboardHeight = 0;
          this.isKeyboardOpen = false;
          this.updateToolbarState();
        });
        await Keyboard.addListener('keyboardDidShow', (info: KeyboardInfo) => {
          this.keyboardHeight = info.keyboardHeight;
          this.isKeyboardOpen = true;
          this.updateToolbarState();
        });
        await Keyboard.addListener('keyboardDidHide', () => {
          this.keyboardHeight = 0;
          this.isKeyboardOpen = false;
          this.updateToolbarState();
        });
      } catch {
        this.setupWebKeyboardDetection();
      }
    } else {
      this.setupWebKeyboardDetection();
    }
  }

  private setupWebKeyboardDetection(): void {
    let previousHeight = window.innerHeight;
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      if (currentHeight < previousHeight && currentHeight < window.outerHeight) {
        this.keyboardHeight = previousHeight - currentHeight;
        this.isKeyboardOpen = true;
      } else if (currentHeight >= window.outerHeight || currentHeight > previousHeight) {
        this.keyboardHeight = 0;
        this.isKeyboardOpen = false;
      }
      previousHeight = currentHeight;
      this.updateToolbarState();
    };
    window.addEventListener('resize', handleResize);
  }

  /**
   * WKWebView + iOS: keyboard height often tracks visualViewport; Capacitor events still apply when present.
   */
  private attachVisualViewportListener(): void {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }
    const vv = window.visualViewport;
    const updateFromViewport = () => {
      const winH = window.innerHeight;
      const overlapFromBottom = winH - (vv.height + vv.offsetTop);
      if (overlapFromBottom > 64) {
        this.keyboardHeight = Math.round(overlapFromBottom);
        this.isKeyboardOpen = true;
        this.updateToolbarState();
      }
    };
    vv.addEventListener('resize', updateFromViewport);
    vv.addEventListener('scroll', updateFromViewport);
  }

  private updateToolbarState(): void {
    const editor = this.activeQuillEditor$.value;
    const currentState = this.toolbarState$.value;
    this.toolbarState$.next({
      ...currentState,
      keyboardHeight: this.keyboardHeight,
      isVisible: !!(editor && this.isKeyboardOpen),
    });
  }
}
