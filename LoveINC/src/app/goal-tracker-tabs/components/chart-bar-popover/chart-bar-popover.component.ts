import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart-bar-popover',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-bar-popover">
      <p class="popover-label">{{ label }}</p>
      <p class="popover-value">{{ completed }} of {{ scheduled }} habits</p>
    </div>
  `,
  styles: [`
    .chart-bar-popover {
      padding: 0.35rem 0.5rem;
      width: max-content;
      max-width: 6.625rem;
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
export class ChartBarPopoverComponent {
  @Input() label = '';
  @Input() completed = 0;
  @Input() scheduled = 0;
}
