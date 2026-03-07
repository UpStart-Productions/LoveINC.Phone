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

  // CTA (donation-drive, volunteer, fundraiser, awareness): date range
  startDate?: string;
  endDate?: string;
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
  | 'fundraiser'
  | 'awareness';
