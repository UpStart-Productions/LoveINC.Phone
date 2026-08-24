import type { ContentPlanAuthor } from './content-plan.model';
import type { PlatformTeamMember } from '../services/platform/types';

function normalizeAuthorName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function teamMemberDisplayName(member: PlatformTeamMember): string {
  return [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
}

export function findTeamMemberByAuthorName(
  authorName: string,
  teamMembers: PlatformTeamMember[]
): PlatformTeamMember | undefined {
  const key = normalizeAuthorName(authorName);
  if (!key) {
    return undefined;
  }

  return teamMembers.find((member) => normalizeAuthorName(teamMemberDisplayName(member)) === key);
}

export function enrichPlanAuthorFromTeam(
  author: ContentPlanAuthor,
  teamMembers: PlatformTeamMember[],
  resolveUploadUrl: (path?: string) => string
): ContentPlanAuthor {
  if (author.bio?.trim()) {
    return author;
  }

  const member = findTeamMemberByAuthorName(author.name, teamMembers);
  const bio = member?.bio?.trim();
  if (!member || !bio) {
    return author;
  }

  const photoRaw = member.photoUrl?.trim();
  return {
    ...author,
    title: author.title?.trim() || member.title?.trim() || undefined,
    bio,
    avatarUrl:
      author.avatarUrl ||
      (photoRaw ? resolveUploadUrl(photoRaw) || photoRaw : undefined),
  };
}
