import type { ContentPlanAuthor } from './content-plan.model';
import type { PlatformPerson, PlatformTeamMember } from '../services/platform/types';

function normalizeAuthorName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** True when Quill/plain text has readable content (not empty tags). */
export function hasMeaningfulRichText(value?: string | null): boolean {
  const raw = value?.trim();
  if (!raw) {
    return false;
  }

  const plain = raw
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plain.length > 0;
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

function resolveAuthorBio(raw?: string | null): string | undefined {
  return hasMeaningfulRichText(raw) ? raw!.trim() : undefined;
}

export function enrichPlanAuthorFromTeam(
  author: ContentPlanAuthor,
  teamMembers: PlatformTeamMember[],
  resolveUploadUrl: (path?: string) => string
): ContentPlanAuthor {
  if (hasMeaningfulRichText(author.bio)) {
    return author;
  }

  const member = findTeamMemberByAuthorName(author.name, teamMembers);
  const bio = resolveAuthorBio(member?.bio);
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

export function enrichPlanAuthorFromPerson(
  author: ContentPlanAuthor,
  person: PlatformPerson | null | undefined,
  resolveUploadUrl: (path?: string) => string
): ContentPlanAuthor {
  if (!person || hasMeaningfulRichText(author.bio)) {
    return author;
  }

  const bio = resolveAuthorBio(person.bio ?? person.notes);
  if (!bio) {
    return author;
  }

  const photoRaw = person.photoUrl?.trim();
  return {
    ...author,
    title: author.title?.trim() || person.title?.trim() || undefined,
    bio,
    avatarUrl:
      author.avatarUrl ||
      (photoRaw ? resolveUploadUrl(photoRaw) || photoRaw : undefined),
  };
}
