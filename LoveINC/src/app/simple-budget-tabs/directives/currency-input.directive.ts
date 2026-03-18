import {
  Directive,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: 'ion-input[appCurrencyInput]',
  standalone: true,
})
export class CurrencyInputDirective implements AfterViewInit, OnDestroy {
  private listener: ((e: InputEvent) => void) | null = null;

  constructor(private el: ElementRef<HTMLIonInputElement>) {}

  async ngAfterViewInit(): Promise<void> {
    const ionInput = this.el.nativeElement;
    const native = await ionInput.getInputElement();
    if (!native) return;
    this.listener = (e: InputEvent) => this.handleBeforeInput(e, native);
    native.addEventListener('beforeinput', this.listener);
  }

  ngOnDestroy(): void {
    this.el.nativeElement.getInputElement().then((native) => {
      if (native && this.listener) {
        native.removeEventListener('beforeinput', this.listener);
      }
    });
  }

  private handleBeforeInput(e: InputEvent, input: HTMLInputElement): void {
    if (e.data == null) return;
    const { value, selectionStart, selectionEnd } = input;
    const start = selectionStart ?? value.length;
    const end = selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const wouldBe = before + (e.data || '') + after;
    const sanitized = this.sanitize(wouldBe);
    if (sanitized !== wouldBe) {
      e.preventDefault();
      if (e.inputType === 'insertFromPaste' && sanitized !== '') {
        input.value = sanitized;
        input.setSelectionRange(sanitized.length, sanitized.length);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  private sanitize(s: string): string {
    let out = s.replace(/[^0-9.]/g, '');
    const parts = out.split('.');
    if (parts.length > 2) out = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) {
      out = parts[0] + '.' + parts[1].slice(0, 2);
    }
    if (out.startsWith('0') && out.length > 1 && !out.startsWith('0.')) {
      out = out.replace(/^0+/, '') || '0';
    }
    return out;
  }
}
