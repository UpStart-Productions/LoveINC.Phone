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

  ngAfterViewInit(): void {
    // layout hooks
  }

  ngOnDestroy(): void {
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
    this.editorInstance = editor;
    if (!this.config.disableToolbarAutoRegister) {
      this.quillToolbarService.registerQuillEditor(editor);
    }
    this.editorCreated.emit(editor);
    this.enforceHorizontalTextOrientation();
    this.fixH1CursorJumping(editor);
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
    const newContent = value || '';
    if (newContent === this.content) {
      return;
    }
    this.content = newContent;
    if (this.editorInstance) {
      this.editorInstance.root.innerHTML = this.content;
    } else {
      const el = this.elementRef.nativeElement.querySelector('.ql-editor');
      if (el) {
        el.innerHTML = this.content;
      }
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
