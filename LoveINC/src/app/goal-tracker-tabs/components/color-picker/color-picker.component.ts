import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ColorOption {
  color: string;
}

@Component({
  selector: 'app-color-picker',
  templateUrl: 'color-picker.component.html',
  styleUrls: ['color-picker.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ColorPickerComponent {
  @Input() config: ColorOption[] = [];
  @Input() label = 'Pick a color';
  @Input() selectedColor = 'prussian-blue';
  @Output() colorSelectedEvent = new EventEmitter<string>();
  @Output() dirtyControlEvent = new EventEmitter<boolean>();

  state: 'open' | 'closed' = 'closed';

  toggleOpenClose() {
    this.state = this.state === 'open' ? 'closed' : 'open';
  }

  selectColor(color: string, ev: Event) {
    this.selectedColor = color;
    this.state = 'closed';
    ev.stopPropagation();
    this.colorSelectedEvent.emit(color);
    this.dirtyControlEvent.emit(true);
  }

  ngAfterViewInit() {
    if (this.selectedColor === '' && this.config.length > 0) {
      this.selectedColor = this.config[0].color;
    }
    this.colorSelectedEvent.emit(this.selectedColor);
  }
}
