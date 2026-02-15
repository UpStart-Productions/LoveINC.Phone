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
  scheduleRule?: PlatformScheduleRule;
  sessions?: Array<{ startDate: string; endDate: string; isCancelled?: boolean }>;
}

export interface PlatformServiceItem {
  id: string;
  label: string;
  sortOrder: number;
}

export interface PlatformService {
  id: string;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  photoUrl?: string;
  items: PlatformServiceItem[];
  offerings: PlatformOffering[];
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
  photoUrl?: string;
  events?: Array<{ id: string; title: string }>;
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
  [key: string]: unknown;
}
