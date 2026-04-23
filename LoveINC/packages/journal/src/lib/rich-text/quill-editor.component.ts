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
import { QuillToolbarService } from './quill-toolbar.service';
import { registerJournalQuillDividerBlot } from './journal-divider-blot';

/**
 * For the incremental `text-change` delta, approximate collapsed-caret index after the change
 * when getSelection is temporarily null (e.g. some WebViews / composition).
 */
function cursorIndexAfterThisChangeDelta(changeDelta: { ops?: Array<Record<string, unknown>> }): number | null {
  const ops = changeDelta?.ops;
  if (!ops?.length) {
    return null;
  }
  let index = 0;
  for (const op of ops) {
    if (typeof op['retain'] === 'number') {
      index += op['retain'] as number;
    }
    const ins = op['insert'];
    if (ins != null) {
      if (typeof ins === 'string') {
        index += (ins as string).length;
      } else {
        index += 1;
      }
    }
  }
  return index;
}

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
  private dashToDividerListener: ((d: unknown, o: unknown, s: string) => void) | null = null;
  private processingDividerRule = false;

  ngAfterViewInit(): void {
    // layout hooks
  }

  ngOnDestroy(): void {
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
    if (this.editorInstance) {
      if (this.dashToDividerListener) {
        this.editorInstance.off('text-change', this.dashToDividerListener);
        this.dashToDividerListener = null;
      }
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
    this.editorInstance = editor;
    // Must be the `Quill` from the same JS module as this instance, or the blot is never in the
    // instance registry (and insertEmbed is a no-op / wrong format).
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
    this.dashToDividerListener = (delta, oldDelta, source) => {
      this.onTextChangeForTripleDash(
        editor,
        source,
        delta as { ops?: Array<Record<string, unknown>> },
        oldDelta
      );
    };
    editor.on('text-change', this.dashToDividerListener);
    this.editorCreated.emit(editor);
    this.enforceHorizontalTextOrientation();
    this.fixH1CursorJumping(editor);
  }

  /** Notion-style: a line that is only `---` (optional leading spaces) becomes a light divider. */
  private onTextChangeForTripleDash(
    editor: any,
    source: string,
    changeDelta: { ops?: Array<Record<string, unknown>> },
    _oldDelta: unknown
  ): void {
    if (this.processingDividerRule) {
      return;
    }
    // Do not run on our own delete/insert or silent setContents; 'silent' is Quill 2.
    if (source === 'silent' || String(source) === 'silent') {
      return;
    }

    const run = (range: { index: number; length: number } | null) => {
      if (!range || range.length > 0) {
        return;
      }
      const textBefore = editor.getText(0, range.index);
      const lastLine = textBefore.split('\n').pop() ?? '';
      if (lastLine.trim() !== '---') {
        return;
      }
      const lineStart = range.index - lastLine.length;
      if (lineStart < 0) {
        return;
      }
      this.processingDividerRule = true;
      try {
        editor.deleteText(lineStart, lastLine.length, 'user');
        editor.insertEmbed(lineStart, 'journalDivider', true, 'user');
        const after = lineStart + 1;
        editor.setSelection(after, 0, 'user');
      } finally {
        this.processingDividerRule = false;
      }
    };

    // Sync: right after user input Quill has usually updated selection; focus helps WebViews.
    let range = (editor.getSelection(true) as { index: number; length: number } | null) ?? null;
    if (!range) {
      const idx = cursorIndexAfterThisChangeDelta(changeDelta);
      if (idx != null) {
        range = { index: idx, length: 0 };
      }
    }
    if (range) {
      run(range);
    } else {
      // Next frame: iOS/IME often report selection only after a tick.
      queueMicrotask(() => {
        if (this.processingDividerRule) {
          return;
        }
        const r =
          (editor.getSelection(true) as { index: number; length: number } | null) ??
          (() => {
            const idx = cursorIndexAfterThisChangeDelta(changeDelta);
            return idx != null ? { index: idx, length: 0 } : null;
          })();
        if (r) {
          run(r);
        }
      });
    }
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
