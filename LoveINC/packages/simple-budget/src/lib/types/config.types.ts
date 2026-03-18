/**
 * Config type definitions for Simple Budget
 */

export interface SimpleBudgetConfig {
  /** Week start day: 0 = Sunday, 1 = Monday, etc. */
  weekStartDay: number;
  /** Carry forward flexible targets when copying to next week */
  carryForwardFlexibleTargets: boolean;
}

export const DEFAULT_CONFIG: SimpleBudgetConfig = {
  weekStartDay: 1, // Monday
  carryForwardFlexibleTargets: true,
};
