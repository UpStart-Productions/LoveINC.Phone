import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pie-slice-popover',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pie-slice-popover">
      <p class="popover-label">{{ label }}</p>
      <p class="popover-value">{{ formattedAmount }}</p>
    </div>
  `,
  styles: [`
    .pie-slice-popover {
      padding: 0.35rem 0.5rem;
      width: max-content;
      max-width: 10rem;
    }

    .popover-label {
      margin: 0 0 0.25rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .popover-value {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 600;
      color: #ffffff;
    }
  `],
})
export class PieSlicePopoverComponent {
  @Input() label = '';
  @Input() value = 0;

  get formattedAmount(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.value);
  }
}
