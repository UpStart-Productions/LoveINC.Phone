import type { PlatformVolunteerPosition } from '../../services/platform/types';

export function isVolunteerPositionOpen(position: PlatformVolunteerPosition): boolean {
  return position.isOpen !== false;
}

/** Active positions from the API — open first, then closed. */
export function sortVolunteerPositionsOpenFirst<T extends PlatformVolunteerPosition>(
  positions: T[]
): T[] {
  return [...positions].sort((a, b) => {
    const aOpen = isVolunteerPositionOpen(a) ? 1 : 0;
    const bOpen = isVolunteerPositionOpen(b) ? 1 : 0;
    if (bOpen !== aOpen) return bOpen - aOpen;
    return (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
  });
}
