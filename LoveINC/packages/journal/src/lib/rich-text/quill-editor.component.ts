import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  inject,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuillEditorComponent } from 'ngx-quill';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { QuillToolbarService } from './quill-toolbar.service';
import { registerJournalQuillDividerBlot } from './journal-divider-blot';

export interface JournalQuillEditorConfig {
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
  disableToolbarAutoRegister?: boolean;
}

@Component({
  selector: 'app-journal-quill-editor',
  templateUrl: './quill-editor.component.html',
  styleUrls: ['./quill-editor.component.scss'],
  standalone: true,
  imports: [CommonModule, QuillEditorComponent, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => JournalQuillEditorComponent),
      multi: true,
    },
  ],
})
export class JournalQuillEditorComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  private quillToolbarService = inject(QuillToolbarService);
  private elementRef = inject(ElementRef);

  @Input() config: JournalQuillEditorConfig = {
    placeholder: 'Start writing...',
    height: 'auto',
    readOnly: false,
    disableToolbarAutoRegister: false,
  };

  @Output() editorCreated = new EventEmitter<any>();
  @Output() contentChanged = new EventEmitter<any>();

  content = '';
  /** Quill `modules` option — hide built-in toolbar; floating bar handles formatting. */
  quillModules: { toolbar: boolean } = { toolbar: false };

  private onChange = (value: string) => {
    // CVA
  };
  private onTouched = () => {
    // CVA
  };
  private editorInstance: any = null;
  private focusInListener: (() => void) | null = null;
  private focusOutListener: (() => void) | null = null;
  private textChangeCaretAndScrollHandler:
    | ((delta: unknown, oldDelta: unknown, source: string) => void)
    | null = null;
  private selectionChangeCaretHandler:
    | ((range: unknown, oldRange: unknown, source: string) => void)
    | null = null;
  private keyboardShowListener: PluginListenerHandle | null = null;
  private keyboardHideListener: PluginListenerHandle | null = null;
  private nativeKeyboardPadBound = false;
  private currentKeyboardHeight = 0;
  /** Matches `height` in `quill-floating-toolbar.component.scss` */
  private readonly floatingToolbarHeightPx = 50;
  private readonly extraCaretLineMarginPx = 4;
  /**
   * Extra space *above* the toolbar band: start inner/outer scroll while the caret line is
   * still this far below the header area (higher on screen than “flush to the toolbar”).
   */
  private readonly typingLineBreathingRoomPx = 56;

  ngAfterViewInit(): void {
    // layout hooks
  }

  ngOnDestroy(): void {
    void this.keyboardShowListener?.remove();
    void this.keyboardHideListener?.remove();
    this.keyboardShowListener = null;
    this.keyboardHideListener = null;

    const root = this.editorInstance?.root as HTMLElement | undefined;
    if (root) {
      if (this.focusInListener) {
        root.removeEventListener('focusin', this.focusInListener);
      }
      if (this.focusOutListener) {
        root.removeEventListener('focusout', this.focusOutListener);
      }
    }
    this.focusInListener = null;
    this.focusOutListener = null;
    if (this.editorInstance && this.textChangeCaretAndScrollHandler) {
      this.editorInstance.off('text-change', this.textChangeCaretAndScrollHandler);
    }
    this.textChangeCaretAndScrollHandler = null;
    if (this.editorInstance && this.selectionChangeCaretHandler) {
      this.editorInstance.off('selection-change', this.selectionChangeCaretHandler);
    }
    this.selectionChangeCaretHandler = null;
    if (this.editorInstance) {
      this.quillToolbarService.unregisterQuillEditor();
    }
  }

  onModelChange(value: string): void {
    this.content = value;
    this.onChange(value);
    this.contentChanged.emit({
      html: value,
      text: this.editorInstance?.getText?.() ?? '',
      source: 'user',
    });
  }

  onEditorCreated(editor: any): void {
    const previous = this.editorInstance;
    if (previous) {
      if (this.textChangeCaretAndScrollHandler) {
        previous.off('text-change', this.textChangeCaretAndScrollHandler);
        this.textChangeCaretAndScrollHandler = null;
      }
      if (this.selectionChangeCaretHandler) {
        previous.off('selection-change', this.selectionChangeCaretHandler);
        this.selectionChangeCaretHandler = null;
      }
      const prevRoot = previous.root as HTMLElement;
      if (this.focusInListener) {
        prevRoot.removeEventListener('focusin', this.focusInListener);
      }
      if (this.focusOutListener) {
        prevRoot.removeEventListener('focusout', this.focusOutListener);
      }
      this.quillToolbarService.unregisterQuillEditor();
    }
    this.editorInstance = editor;
    const Quill = Object.getPrototypeOf(editor).constructor as typeof import('quill').default;
    registerJournalQuillDividerBlot(Quill);
    if (!this.config.disableToolbarAutoRegister) {
      this.quillToolbarService.registerQuillEditor(editor);
    }
    this.focusInListener = () => this.quillToolbarService.notifyEditorContentFocus();
    this.focusOutListener = () => this.quillToolbarService.notifyEditorContentBlur();
    const root = editor.root as HTMLElement;
    root.addEventListener('focusin', this.focusInListener);
    root.addEventListener('focusout', this.focusOutListener);
    this.applyHtmlToEditor(editor, this.content);
    this.editorCreated.emit(editor);
    this.enforceHorizontalTextOrientation();
    this.fixH1CursorJumping(editor);
    this.attachTextChangeCaretAndKeyboardScroll(editor);
    if (!this.nativeKeyboardPadBound) {
      this.nativeKeyboardPadBound = true;
      void this.bindNativeKeyboardPadding();
    }
  }

  /**
   * Tabs keep `KeyboardResize.None` so the FAB does not move; the webview does not shrink, so
   * we add bottom padding to `.ql-editor` and nudge `ion-content` (Nepho pattern).
   */
  private async bindNativeKeyboardPadding(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      this.keyboardShowListener = await Keyboard.addListener('keyboardDidShow', (info) => {
        this.currentKeyboardHeight = info.keyboardHeight;
        this.adjustEditorPaddingForKeyboard(info.keyboardHeight);
      });
      this.keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
        this.currentKeyboardHeight = 0;
        this.adjustEditorPaddingForKeyboard(0);
      });
    } catch {
      // Keyboard plugin not available
    }
  }

  private adjustEditorPaddingForKeyboard(keyboardHeight: number): void {
    const container = this.elementRef.nativeElement.querySelector('.quill-editor-container');
    const editor = container?.querySelector('.ql-editor') as HTMLElement | undefined;
    if (!editor) {
      return;
    }
    if (keyboardHeight > 0) {
      const bottomSpace =
        keyboardHeight +
        this.floatingToolbarHeightPx +
        20 +
        this.typingLineBreathingRoomPx;
      editor.style.paddingBottom = `${bottomSpace}px`;
    } else {
      editor.style.paddingBottom = '';
    }
  }

  private simpleScrollDown(): void {
    const ionContent = this.elementRef.nativeElement.closest('ion-content') as
      | HTMLElement
      | null
      | undefined;
    if (ionContent && typeof (ionContent as any).scrollByPoint === 'function') {
      const scrollAmount =
        this.currentKeyboardHeight > 0
          ? Math.max(50, this.currentKeyboardHeight / 3)
          : 30;
      void (ionContent as any).scrollByPoint(0, scrollAmount, 150);
      return;
    }
    const scrollAmount =
      this.currentKeyboardHeight > 0
        ? Math.max(50, this.currentKeyboardHeight / 3)
        : 30;
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  }

  /** Max viewport Y for the bottom of the caret/selection (smaller = must stay higher on screen). */
  private maxCaretBottomViewportY(): number {
    if (typeof window === 'undefined') {
      return 0;
    }
    return (
      window.innerHeight -
      this.currentKeyboardHeight -
      this.floatingToolbarHeightPx -
      this.extraCaretLineMarginPx -
      this.typingLineBreathingRoomPx
    );
  }

  /**
   * `scrollSelectionIntoView` only avoids the bottom of the `.ql-editor` box. The fixed
   * floating toolbar (50px) sits on top of that area. Quill 2 `getBounds` uses
   * `getBoundingClientRect()` (viewport Y), not scroll-container coordinates.
   * Scroll the `.ql-editor` so the caret stays in the typing band above the toolbar
   * (including {@link typingLineBreathingRoomPx}).
   */
  private keepCaretAboveFloatingToolbar(editor: any): void {
    if (this.currentKeyboardHeight < 1 || typeof window === 'undefined') {
      return;
    }
    const root = editor.root as HTMLElement | undefined;
    if (!root) {
      return;
    }
    const range = editor.getSelection() as { index: number; length: number } | null;
    if (!range) {
      return;
    }
    const len = range.length > 0 ? range.length : 1;
    let b: { top: number; height: number; bottom?: number } | null;
    try {
      b = editor.getBounds(range.index, len) as { top: number; height: number; bottom?: number } | null;
    } catch {
      return;
    }
    if (b == null || typeof b.top !== 'number') {
      return;
    }
    const lineBottom =
      typeof b.bottom === 'number' && !Number.isNaN(b.bottom)
        ? b.bottom
        : b.top + Math.max(b.height || 0, 1);
    const safeY = this.maxCaretBottomViewportY();
    if (lineBottom > safeY) {
      root.scrollTop += lineBottom - safeY;
    }
  }

  /** If the native caret rect is still under the bar / keyboard, nudge the host `ion-content`. */
  private nudgeIonContentIfCaretBelowToolbarLine(editor: any): void {
    if (this.currentKeyboardHeight < 1 || typeof window === 'undefined') {
      return;
    }
    const root = editor.root as HTMLElement;
    if (!root) {
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount < 1) {
      return;
    }
    const r = sel.getRangeAt(0);
    if (!root.contains(r.commonAncestorContainer)) {
      return;
    }
    const br = r.getBoundingClientRect();
    if (br.width < 1 && br.height < 1) {
      return;
    }
    const safeY = this.maxCaretBottomViewportY();
    if (br.bottom > safeY) {
      this.simpleScrollDown();
    }
  }

  private syncCaretWithKeyboardToolbar(editor: any): void {
    try {
      if (typeof editor.scrollSelectionIntoView === 'function') {
        editor.scrollSelectionIntoView();
      }
    } catch {
      // ignore
    }
    if (this.currentKeyboardHeight < 1) {
      return;
    }
    this.keepCaretAboveFloatingToolbar(editor);
    this.nudgeIonContentIfCaretBelowToolbarLine(editor);
  }

  private attachTextChangeCaretAndKeyboardScroll(editor: any): void {
    this.textChangeCaretAndScrollHandler = (
      _delta: unknown,
      _oldDelta: unknown,
      source: string
    ) => {
      if (source !== 'user') {
        return;
      }
      requestAnimationFrame(() => this.syncCaretWithKeyboardToolbar(editor));
    };
    editor.on('text-change', this.textChangeCaretAndScrollHandler);

    this.selectionChangeCaretHandler = (
      _range: unknown,
      _oldRange: unknown,
      source: string
    ) => {
      if (source !== 'user') {
        return;
      }
      requestAnimationFrame(() => this.syncCaretWithKeyboardToolbar(editor));
    };
    editor.on('selection-change', this.selectionChangeCaretHandler);
  }

  /**
   * Must go through Quill's clipboard so the internal Delta matches the DOM.
   * Assigning root.innerHTML directly desyncs the model and often drops the first character on reload.
   */
  private applyHtmlToEditor(editor: any, html: string): void {
    if (!editor?.clipboard) return;
    if (html == null || html === '') {
      editor.setText('');
      return;
    }
    editor.clipboard.dangerouslyPasteHTML(html);
  }

  private enforceHorizontalTextOrientation(): void {
    setTimeout(() => {
      const editorElement = this.elementRef.nativeElement.querySelector('.ql-editor');
      if (!editorElement) return;
      (editorElement as HTMLElement).style.writingMode = 'horizontal-tb';
      (editorElement as HTMLElement).style.textOrientation = 'mixed';
      (editorElement as HTMLElement).style.direction = 'ltr';
    }, 100);
  }

  private fixH1CursorJumping(editor: any): void {
    const keyboard = editor.getModule('keyboard');
    if (!keyboard?.addBinding) return;
    keyboard.addBinding(
      {
        key: 'Enter',
        collapsed: true,
      },
      (range: any) => {
        const format = editor.getFormat(range);
        const currentLength = editor.getLength();
        if (format.header) {
          const selection = editor.getSelection();
          if (selection) {
            if (currentLength <= 1 || currentLength === selection.index + 1) {
              editor.insertText(selection.index, '\n\n', 'user');
              editor.formatText(selection.index + 1, 1, 'header', false, 'user');
              editor.setSelection(selection.index + 1, 0, 'user');
            } else {
              editor.insertText(selection.index, '\n', 'user');
              editor.removeFormat(selection.index + 1, 1, 'user');
              editor.setSelection(selection.index + 1, 0, 'user');
            }
            return false;
          }
        }
        return true;
      }
    );
  }

  writeValue(value: string | null): void {
    const newContent = value ?? '';
    if (newContent === this.content) {
      return;
    }
    this.content = newContent;
    if (this.editorInstance) {
      this.applyHtmlToEditor(this.editorInstance, newContent);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.config = { ...this.config, readOnly: isDisabled };
  }
}
