/**
 * Date/time formatting and notification deep-link mapping.
 * @see src/app/shared/README.md
 */
export { shouldHideMainTabBar } from './route-utils';
export { isVolunteerPositionOpen, sortVolunteerPositionsOpenFirst } from './volunteer-position.util';
export {
  APP_AVATAR_PALETTE,
  resolveAvatarBackgroundColor,
} from './avatar-palette.util';
export { navigateAppBack } from './navigation-back.util';
export { navigateAppForward } from './navigation-forward.util';
export { navigateAppFlat } from './navigation-flat.util';
export {
  MICRO_APP_ROOT_SEGMENTS,
  treeContainsMicroApp,
  urlContainsMicroApp,
} from './navigation-micro-app.util';
export {
  MAIN_TAB_SEGMENTS,
  applyActiveTabPrefix,
  resolveActiveMainTabSegment,
  resolveStackParentUrl,
} from './navigation-tab-prefix.util';
export {
  resolveReturnUrl,
  resolveReturnUrlFromRouteTree,
} from './navigation-origin.util';
export { mapNotificationMetaToContentType, getNotificationRoute, type NotificationMeta } from './notification-deeplink';
export { markQuillParagraphGaps } from './quill-rich-html';
export { linkifyRichHtmlEmails, handleRichHtmlClick } from './rich-html-links';
export {
  APP_DOT,
  DEFAULT_DISPLAY_TIME_ZONE,
  setDisplayTimeZone,
  getDisplayTimeZone,
  joinWithAppDot,
  isUtcDateOnlyIso,
  apiIsoToDisplayDate,
  formatIsoTime12hr,
  formatClassListDateRange,
  formatEventDatesCompact,
  formatDateRangeCompact,
  formatTimeRangeCompact,
  formatTimeStringCompact,
  formatEventSubtitle,
  formatTimeStringFull,
  formatSessionTime,
  formatTimeRangeFull,
  formatClassSessionSubtitle,
  dayTo2Letter,
  dayNumberTo2Letter,
  uppercaseMonth,
} from './date-time-formatting';
