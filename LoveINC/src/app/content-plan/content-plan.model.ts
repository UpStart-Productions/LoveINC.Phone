/** Portable content-plan types — not tied to Love INC or GrovLink naming in UI code. */

export type ContentPlanDisplayStyle = 'SINGLE_PAGE' | 'MULTI_PAGE' | 'LIST';

/** How a theme's paths are browsed in the app (Cover Cards, Detail Cards, List). */
export type ContentPlanThemeDisplayStyle = 'COVER_CARDS' | 'DETAIL_CARDS' | 'LIST';

export interface ContentPlanBlock {
  id?: string;
  order: number;
  blockId: string;
  type: string;
  content: Record<string, unknown>;
}

export interface ContentPlanMoment {
  planMomentId: string;
  order: number;
  id: string;
  title: string;
  shared: boolean;
  blocks: ContentPlanBlock[];
}

export interface ContentPlanAuthor {
  name: string;
  avatarUrl?: string;
  /** Job / role title when available from the plan or team record. */
  title?: string;
  /** Bio HTML when available from the plan or team record. */
  bio?: string;
}

export interface ContentPlanTheme {
  id: string;
  name: string;
  subtitle?: string;
  iconSvg?: string;
  isActive: boolean;
  showOnHome: boolean;
  displayStyle: ContentPlanThemeDisplayStyle;
}

export interface ContentPlan {
  id: string;
  slug: string;
  title: string;
  order: number;
  coverPhotoUrl?: string;
  author: ContentPlanAuthor;
  theme: ContentPlanTheme;
  displayStyle: ContentPlanDisplayStyle;
  moments: ContentPlanMoment[];
  createdAt?: string;
}
