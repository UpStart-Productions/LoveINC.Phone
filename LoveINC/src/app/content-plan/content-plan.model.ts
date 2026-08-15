/** Portable content-plan types — not tied to Love INC or GrovLink naming in UI code. */

export type ContentPlanDisplayStyle = 'SINGLE_PAGE' | 'MULTI_PAGE' | 'LIST';

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
}

export interface ContentPlan {
  id: string;
  slug: string;
  title: string;
  coverPhotoUrl?: string;
  author: ContentPlanAuthor;
  displayStyle: ContentPlanDisplayStyle;
  moments: ContentPlanMoment[];
  tags?: string[];
}
