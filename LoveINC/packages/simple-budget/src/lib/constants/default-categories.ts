/**
 * Pre-seeded default categories for Simple Budget
 */

import type { CategoryTemplate } from '../types/category.types';

export const DEFAULT_INCOME_CATEGORIES: CategoryTemplate[] = [
  { id: 'income-paycheck', name: 'Paycheck', type: 'income', sortOrder: 0 },
  { id: 'income-benefits', name: 'Benefits', type: 'income', sortOrder: 1 },
  { id: 'income-sidework', name: 'Side work', type: 'income', sortOrder: 2 },
  { id: 'income-other', name: 'Other', type: 'income', sortOrder: 3 },
];

export const DEFAULT_BILLS_CATEGORIES: CategoryTemplate[] = [
  { id: 'bills-rent', name: 'Rent or mortgage', type: 'bills', sortOrder: 0 },
  { id: 'bills-electric', name: 'Electric', type: 'bills', sortOrder: 1 },
  { id: 'bills-gas', name: 'Gas utility', type: 'bills', sortOrder: 2 },
  { id: 'bills-water', name: 'Water', type: 'bills', sortOrder: 3 },
  { id: 'bills-phone', name: 'Phone', type: 'bills', sortOrder: 4 },
  { id: 'bills-internet', name: 'Internet', type: 'bills', sortOrder: 5 },
  { id: 'bills-insurance', name: 'Insurance', type: 'bills', sortOrder: 6 },
  { id: 'bills-debt', name: 'Debt payment', type: 'bills', sortOrder: 7 },
  { id: 'bills-childcare', name: 'Childcare', type: 'bills', sortOrder: 8 },
  { id: 'bills-other', name: 'Other', type: 'bills', sortOrder: 9 },
];

export const DEFAULT_FLEXIBLE_CATEGORIES: CategoryTemplate[] = [
  { id: 'flex-groceries', name: 'Groceries', type: 'flexible', sortOrder: 0 },
  { id: 'flex-gas', name: 'Gas for car', type: 'flexible', sortOrder: 1 },
  { id: 'flex-household', name: 'Household', type: 'flexible', sortOrder: 2 },
  { id: 'flex-medical', name: 'Medical', type: 'flexible', sortOrder: 3 },
  { id: 'flex-personal', name: 'Personal', type: 'flexible', sortOrder: 4 },
  { id: 'flex-other', name: 'Other', type: 'flexible', sortOrder: 5 },
];

export const ALL_DEFAULT_CATEGORIES: CategoryTemplate[] = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_BILLS_CATEGORIES,
  ...DEFAULT_FLEXIBLE_CATEGORIES,
];
