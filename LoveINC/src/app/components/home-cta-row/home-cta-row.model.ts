export interface HomeCtaProgress {
  current: number;
  goal: number;
  unitLabel?: string;
}

export type HomeCtaAction =
  | { kind: 'route'; path: string[]; queryParams?: Record<string, string> }
  | { kind: 'content-detail'; contentType: string; id: string }
  | { kind: 'donate-sheet' }
  | {
      kind: 'get-help';
      target: 'assistance-intro' | 'profile' | 'gap-ministries' | 'services';
    };

/** Single home-screen CTA row — static or API-driven. */
export interface HomeCtaRowModel {
  id: string;
  body: string;
  subtitle?: string;
  photoUrl?: string;
  iconName?: string;
  iconColor: string;
  pillText: string;
  pillColor: string;
  progress?: HomeCtaProgress;
  action: HomeCtaAction;
}
