/**
 * Quick Adjust checklist options (suggestions only, not auto-edits)
 */

export interface QuickAdjustOption {
  id: string;
  label: string;
}

export const QUICK_ADJUST_OPTIONS: QuickAdjustOption[] = [
  { id: 'reduce-flexible', label: 'Reduce flexible spending targets' },
  { id: 'delay-bill', label: 'Delay a bill payment to next week' },
  { id: 'extra-income', label: 'Look for extra income' },
  { id: 'cut-nonessential', label: 'Cut non-essential items' },
  { id: 'ask-help', label: 'Ask for help or payment plan' },
];
