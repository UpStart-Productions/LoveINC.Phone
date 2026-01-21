export type CardType = 
  | 'event'
  | 'volunteer'
  | 'donation-drive'
  | 'impact'
  | 'church-partner'
  | 'class'
  | 'gap-ministry'
  | 'donation-opportunity';

export interface HomeCard {
  id: string;
  type: CardType;
  photoUrl: string;
  title: string;
  subtitle: string;
  description: string;
  link: string;
  priority: number;
}

export const CardTypeLabels: Record<CardType, string> = {
  'event': 'Event',
  'volunteer': 'Volunteer',
  'donation-drive': 'Donation Drive',
  'impact': 'Impact Story',
  'church-partner': 'Church Partner',
  'class': 'Class',
  'gap-ministry': 'Available Today',
  'donation-opportunity': 'Donation Needed'
};

export const CardTypeIcons: Record<CardType, string> = {
  'event': 'calendar-outline',
  'volunteer': 'heart-outline',
  'donation-drive': 'gift-outline',
  'impact': 'star-outline',
  'church-partner': 'people-outline',
  'class': 'school-outline',
  'gap-ministry': 'time-outline',
  'donation-opportunity': 'hand-left-outline'
};

// Brand colors mapped to match CSS variables in variables.scss
export const CardTypeColors: Record<CardType, string> = {
  'event': '#3B82F6',              // --ion-color-primary
  'volunteer': '#349394',          // --love-inc-teal
  'donation-drive': '#eaa535',     // --love-inc-gold
  'impact': '#8b5cf6',             // purple (standard)
  'church-partner': '#214491',     // --love-inc-blue
  'class': '#10b981',              // green (standard)
  'gap-ministry': '#ef4444',       // red (standard)
  'donation-opportunity': '#f59e0b' // amber (standard)
};
