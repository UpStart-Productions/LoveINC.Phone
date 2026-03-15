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
}

export interface PlatformCustomer {
  id: string;
  slug: string;
  name: string;
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
  address?: PlatformAddress;
  capacity?: number;
  durationMinutes?: number;
  cost?: string;
  photoUrl?: string;
  nextSession?: PlatformClassNextSession;
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

/** Volunteer position with affiliate context (from /volunteer-positions endpoint) */
export interface PlatformVolunteerPositionWithAffiliate extends PlatformVolunteerPosition {
  affiliate: { name: string; phone?: string; email?: string; website?: string };
  address: PlatformAddress;
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
  };
  /** Linked donation location for donation_drive CTAs; enables context-aware Donate Now */
  donation?: { id: string; title: string };
  class?: { id: string; title: string };
  impactStory?: { id: string; title: string };
  photoUrl?: string;
  events?: Array<{ id: string; title: string }>;
  volunteerPositions?: PlatformVolunteerPosition[];
  address?: PlatformAddress;
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
  sortOrder?: number;
  goalType?: string;
  goalValue?: number;
  currentValue?: number;
  actionType?: string;
  actionLabel?: string;
  actionValue?: string;
  address?: PlatformAddress;
  volunteerPositions?: PlatformVolunteerPosition[];
  [key: string]: unknown;
}
