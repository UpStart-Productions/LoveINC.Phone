import { Injectable } from '@angular/core';

/**
 * Shared state for Simple Budget tabs. Tracks the currently selected week
 * so Export (and other tabs) can reflect the same week as the main Budget screen.
 */
@Injectable({
  providedIn: 'root',
})
export class SimpleBudgetStateService {
  /** ISO date string (yyyy-MM-dd) of the selected week's Sunday. */
  selectedWeekStart = '';
}
