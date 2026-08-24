/**
 * Platform API types — aligned with Nonprofit Mobile Platform public API.
 */

export interface PlatformAddress {
  id: string;
  locationName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  /** When the API provides coordinates, the map can skip geocoding. */
  latitude?: number;
  longitude?: number;
}

export interface PlatformOrganization {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  missionStatement?: string;
  logoImageUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  city: string;
  state: string;
  zip: string;
  website?: string;
  /** Customer name when this org is the affiliate/tenant. Use for Service Access messaging. */
  customerName?: string;
  customer?: { name: string };
  /** IANA zone for in-person wall clock (from the affiliate). */
  timezone?: string;
}

export interface PlatformCustomer {
  id: string;
  slug: string;
  name: string;
}

/** GET /public/.../team — affiliate staff (admin Team), not app users. */
export interface PlatformTeamMember {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  interests?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  /** Quill HTML from admin */
  bio?: string;
  sortOrder: number;
}

export interface PlatformEvent {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  startDate: string;
  endDate: string;
  photoUrl?: string;
  address?: PlatformAddress;
  volunteerPositions?: PlatformVolunteerPosition[];
  registrationLink?: string;
  remoteAccess?: boolean;
  joinUrl?: string;
  instructor?: string;
  instructorTitle?: string;
  instructorNotes?: string;
  instructorPhotoUrl?: string;
  attachments?: PlatformClassAttachment[];
}

export interface PlatformClassNextSession {
  startDate: string;
  endDate: string;
  dayOfWeek: string;
  time: string;
}

export interface PlatformClassAttachment {
  id: string;
  label?: string;
  url: string;
  mimeType: string;
  size?: number;
}

export interface PlatformClass {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  instructor?: string;
  /** From People record (affiliate contact title) */
  instructorTitle?: string;
  /** Instructor bio / notes (plain text; API may send `instructor_notes`) */
  instructorNotes?: string;
  /** Resolved upload path or absolute URL; API may also send `instructor_photo_url` */
  instructorPhotoUrl?: string;
  address?: PlatformAddress;
  capacity?: number;
  durationMinutes?: number;
  cost?: string;
  photoUrl?: string;
  nextSession?: PlatformClassNextSession;
  registrationLink?: string;
  remoteAccess?: boolean;
  joinUrl?: string;
  /** Attachments from API (handouts, PDFs, etc.) */
  attachments?: PlatformClassAttachment[];
  /** Alternative: schedule from offerings (scheduleRule + sessions) */
  offerings?: PlatformOffering[];
  volunteerPositions?: PlatformVolunteerPosition[];
}

export interface PlatformScheduleRule {
  ruleType: string;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
}

export interface PlatformOffering {
  id: string;
  provider: { id: string; name: string; phone?: string; email?: string };
  address?: PlatformAddress;
  items: string[];
  shortDescription?: string;
  longDescription?: string;
  photoUrl?: string;
  scheduleRule?: PlatformScheduleRule;
  sessions?: Array<{ startDate: string; endDate: string; isCancelled?: boolean }>;
  /** Derived: true when offering has at least one voucher */
  voucherRequired?: boolean;
  vouchers?: PlatformVoucher[];
  volunteerPositions?: PlatformVolunteerPosition[];
}

/** API may return camelCase or snake_case; we normalize in mapping */
export interface PlatformVolunteerPosition {
  id: string;
  title?: string;
  short_description?: string;
  shortDescription?: string;
  description?: string;
  isOpen?: boolean;
  endDate?: string;
  end_date?: string;
  schedule?: string;
  schedule_rule?: PlatformScheduleRule;
  scheduleRule?: PlatformScheduleRule;
  days_of_week?: number[];
  daysOfWeek?: number[];
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  [key: string]: unknown;
}

/** Volunteer position with affiliate context (from /tabs/volunteer-positions endpoint) */
export interface PlatformVolunteerPositionWithAffiliate extends PlatformVolunteerPosition {
  affiliate: { name: string; phone?: string; email?: string; website?: string };
  address: PlatformAddress;
}

/** Organization partner (provider with organizationPartner=true, from /organization-partners endpoint) */
export interface PlatformPartner {
  id: string;
  slug?: string;
  name: string;
  tagline?: string;
  shortDescription?: string;
  longDescription?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: PlatformAddress;
  photoUrl?: string;
}

export interface PlatformDonation {
  id: string;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  provider: { id: string; name: string; phone?: string; email?: string };
  address?: PlatformAddress;
  photoUrl?: string;
  itemLabels: string[];
  scheduleRule?: PlatformScheduleRule;
  volunteerPositions?: PlatformVolunteerPosition[];
}

export interface PlatformServiceItem {
  id: string;
  label: string;
  sortOrder: number;
}

export interface PlatformVoucher {
  id: string;
  title: string;
  shortDescription?: string;
  voucherExpiryDays?: number;
  itemIds?: string[];
  itemLabels?: string[];
}

export interface PlatformService {
  id: string;
  slug?: string;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  photoUrl?: string;
  items: PlatformServiceItem[];
  offerings: PlatformOffering[];
  /** Derived: true when service or any offering has vouchers */
  voucherRequired?: boolean;
  /** Vouchers for standalone service (no offerings) */
  vouchers?: PlatformVoucher[];
  volunteerPositions?: PlatformVolunteerPosition[];
}


export type PlatformCtaType =
  | 'donation_drive'
  | 'volunteer_call'
  | 'fundraiser'
  | 'awareness';

export interface PlatformCta {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  type: PlatformCtaType;
  startDate?: string;
  endDate?: string;
  /** When true, show CTA start/end dates in the app UI; dates still apply for scheduling either way */
  showDateRangeInApp?: boolean;
  sortOrder: number;
  goalType?: string;
  goalValue?: number;
  currentValue?: number;
  unitLabel?: string;
  actionType?: string;
  actionLabel?: string;
  actionValue?: string;
  service?: { id: string; title: string };
  providerOffering?: {
    id: string;
    service: { id: string; title: string };
    provider: { id: string; name: string };
    address?: PlatformAddress;
  };
  /** Linked donation location for donation_drive CTAs; enables context-aware Donate Now */
  donation?: {
    id: string;
    title: string;
    provider?: { id: string; name: string };
    address?: PlatformAddress;
  };
  class?: {
    id: string;
    title: string;
    nextSession?: PlatformClassNextSession;
  };
  impactStory?: { id: string; title: string };
  photoUrl?: string;
  events?: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
  }>;
  /** Volunteer positions linked to CTA; may include affiliate name for card context */
  volunteerPositions?: Array<PlatformVolunteerPosition & { affiliate?: string }>;
  address?: PlatformAddress;
}

export interface PlatformTransformationToolAuthor {
  name: string;
  avatarUrl?: string;
}

export type PlatformTransformationToolInputType = 'text' | 'radio' | 'checkbox';

export interface PlatformTransformationToolStepInput {
  type: PlatformTransformationToolInputType;
  label: string;
  placeholder?: string;
  options?: string[];
}

export interface PlatformTransformationToolStep {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  /** Quill-authored HTML */
  content: string;
  inputs: PlatformTransformationToolStepInput[];
}

export interface PlatformTransformationTool {
  id: string;
  slug: string;
  title: string;
  author: PlatformTransformationToolAuthor;
  scriptureRefs: string[];
  photoUrl?: string;
  /** Quill-authored HTML for the cover screen */
  introContent: string;
  /** Quill-authored HTML for the closing screen */
  closingContent: string;
  sortOrder: number;
  /** ISO 8601 created timestamp */
  createdAt?: string;
  /** @deprecated Use createdAt — kept for older API responses */
  postedAt?: string;
  steps: PlatformTransformationToolStep[];
}

export interface PlatformImpactStory {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  photoUrl?: string;
  sortOrder: number;
}

export type HomeFeedItemType =
  | 'event'
  | 'class'
  | 'donation-drive'
  | 'volunteer'
  | 'fundraiser'
  | 'awareness'
  | 'impact';

export interface PlatformNotificationMeta {
  itemType: string;
  itemId: string;
  tenantSlug: string;
  /** CTA type (donation_drive, volunteer_call, fundraiser, awareness) — present when itemType is 'cta' */
  ctaType?: string;
}

export interface PlatformNotification {
  id: string;
  itemType: string;
  itemId: string;
  title: string;
  body: string;
  meta: PlatformNotificationMeta;
  createdAt: string;
}

export interface PlatformNotificationResponse {
  notifications: PlatformNotification[];
}

export interface PlatformHomeFeedItem {
  id: string;
  type: HomeFeedItemType;
  photoUrl?: string;
  title: string;
  subtitle?: string;
  /** Short description for card body. Never use long description in cards. */
  shortDescription?: string;
  priority: number;
  startDate?: string;
  endDate?: string;
  instructor?: string;
  instructorTitle?: string;
  sortOrder?: number;
  goalType?: string;
  goalValue?: number;
  currentValue?: number;
  actionType?: string;
  actionLabel?: string;
  actionValue?: string;
  address?: PlatformAddress;
  volunteerPositions?: PlatformVolunteerPosition[];
  remoteAccess?: boolean;
  [key: string]: unknown;
}

export interface PlatformPlanAuthor {
  name: string;
  avatarUrl?: string | null;
  title?: string | null;
  bio?: string | null;
}

export type PlatformThemeDisplayStyle = 'COVER_CARDS' | 'DETAIL_CARDS' | 'LIST';

export interface PlatformPlanTheme {
  id: string;
  name: string;
  subtitle?: string;
  iconSvg?: string;
  isActive: boolean;
  showOnHome?: boolean;
  displayStyle?: PlatformThemeDisplayStyle;
}

export interface PlatformTheme {
  id: string;
  name: string;
  subtitle?: string;
  iconSvg?: string;
  isActive: boolean;
  showOnHome: boolean;
  displayStyle: PlatformThemeDisplayStyle;
  planCount?: number;
}

export type PlatformPlanDisplayStyle = 'SINGLE_PAGE' | 'MULTI_PAGE' | 'LIST';

export interface PlatformPlanBlock {
  id?: string;
  order: number;
  blockId: string;
  type: string;
  content: Record<string, unknown>;
}

export interface PlatformPlanMoment {
  planMomentId: string;
  order: number;
  id: string;
  title: string;
  shared: boolean;
  blocks: PlatformPlanBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformPlan {
  id: string;
  slug: string;
  title: string;
  order?: number;
  coverPhotoUrl?: string;
  author: PlatformPlanAuthor;
  theme: PlatformPlanTheme;
  activationType: string;
  classId?: string;
  class?: { id: string; slug: string; title: string };
  activationStart?: string;
  activationEnd?: string;
  isActive: boolean;
  displayStyle: PlatformPlanDisplayStyle;
  moments: PlatformPlanMoment[];
  createdAt: string;
  updatedAt: string;
}
