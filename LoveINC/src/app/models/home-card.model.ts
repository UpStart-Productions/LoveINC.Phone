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

export const CardTypeColors: Record<CardType, string> = {
  'event': '#3B82F6',
  'volunteer': '#349394',
  'donation-drive': '#eaa535',
  'impact': '#8b5cf6',
  'church-partner': '#214491',
  'class': '#10b981',
  'gap-ministry': '#ef4444',
  'donation-opportunity': '#f59e0b'
};
