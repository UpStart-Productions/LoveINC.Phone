/** Support-request categories — app quality, bugs, a11y, not content areas. */
export const SUPPORT_REQUEST_CATEGORIES = [
  { id: 'performance', label: 'Crashes, freezing, or slowness' },
  { id: 'bug', label: "Something isn't working" },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'navigation', label: 'Navigation or layout' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'account', label: 'Account or sign-in' },
  { id: 'other', label: 'Other' },
] as const;

export type SupportRequestCategoryId =
  (typeof SUPPORT_REQUEST_CATEGORIES)[number]['id'];
