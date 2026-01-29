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
  nextSession?: {
    startDate: string;
    endDate: string;
    dayOfWeek: string;
    time: string;
  };
  
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
}

export type ContentType = 'event' | 'class' | 'impact-story' | 'gap-ministry' | 'donation-opportunity' | 'volunteer' | 'donation-drive' | 'church-partner';
