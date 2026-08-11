/**
 * Date/time formatting and notification deep-link mapping.
 * @see src/app/shared/README.md
 */
export { shouldHideMainTabBar } from './route-utils';
export {
  resolveReturnUrl,
  resolveReturnUrlFromRouteTree,
} from './navigation-origin.util';
export { mapNotificationMetaToContentType, getNotificationRoute, type NotificationMeta } from './notification-deeplink';
export { markQuillParagraphGaps } from './quill-rich-html';
export {
  APP_DOT,
  joinWithAppDot,
  formatClassListDateRange,
  formatEventDatesCompact,
  formatDateRangeCompact,
  formatTimeRangeCompact,
  formatTimeStringCompact,
  formatEventSubtitle,
  formatTimeStringFull,
  formatTimeRangeFull,
  formatClassSessionSubtitle,
  dayTo2Letter,
  dayNumberTo2Letter,
  uppercaseMonth,
} from './date-time-formatting';
