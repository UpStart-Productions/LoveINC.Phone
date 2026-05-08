/**
 * Class document interface for supporting handouts and resources
 */
export interface ClassDocument {
  title: string;
  url?: string;
  type?: 'handout' | 'worksheet' | 'resource';
}

/**
 * Unified interface for all content detail types (events, classes, impact stories, etc.)
 */
export interface ContentDetail {
  id: string;
  title: string;
  description: string;
  photoUrl: string;
  
  // Optional fields that may be present depending on content type
  subtitle?: string;
  
  // Class-specific fields
  teacher?: string;
  /** Job or role title (People record); shown after name as "Name: Title" when set */
  instructorTitle?: string;
  /** Instructor bio/notes; when set, a BIO pill opens the detail sheet */
  instructorNotes?: string;
  /** When set, shown in the Instructor row instead of the person icon */
  instructorPhotoUrl?: string;
  registrationLink?: string;
  durationMinutes?: number;
  cost?: string;
  nextSession?: {
    startDate: string;
    endDate: string;
    dayOfWeek: string;
    time: string;
  };
  classDocuments?: ClassDocument[];
  
  // Event-specific fields
  eventDate?: string;
  eventTime?: string;
  location?: string;
  
  // Impact story fields
  author?: string;
  storyDate?: string;
  
  // Generic action fields
  actionButtonText?: string;
  actionButtonLink?: string;

  // Volunteer CTA fields
  volunteerPositions?: Array<{ id: string; title?: string; shortDescription?: string; longDescription?: string; description?: string; schedule?: string }>;

  // Donation drive CTA: linked donation location for context-aware "Donate Now"
  donation?: { id: string; title: string };

  // CTA and event: raw start/end (ISO strings). Used for calendar add.
  startDate?: string;
  endDate?: string;
  /** Set from platform CTA only; when true, detail UI shows the date range */
  showDateRangeInApp?: boolean;

  // Gap ministry / service: voucher visibility and request
  voucherRequired?: boolean;
  serviceId?: string;
  vouchers?: Array<{ id: string; title: string }>;

  // Partner-specific (church partner)
  phone?: string;
  email?: string;
  website?: string;

  // Volunteer-position-specific (affiliate as subtitle)
  affiliateName?: string;
  /** Formatted schedule string for volunteer positions (not class nextSession) */
  volunteerSchedule?: string;
}

export type ContentType =
  | 'event'
  | 'class'
  | 'impact-story'
  | 'gap-ministry'
  | 'donation-opportunity'
  | 'volunteer'
  | 'donation-drive'
  | 'church-partner'
  | 'partner'
  | 'volunteer-position'
  | 'fundraiser'
  | 'awareness';
