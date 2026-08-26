/** Love INC brand + app accent colors for icon avatar backgrounds. */
export const APP_AVATAR_PALETTE = [
  'var(--love-inc-blue)',
  'var(--love-inc-gold)',
  'var(--love-inc-teal)',
  'var(--love-inc-orange)',
  'var(--love-inc-coral)',
  'var(--love-inc-red)',
  'var(--love-inc-primary-light)',
  'var(--love-inc-tertiary-blue-bright)',
  'var(--love-inc-primary-dark)',
  '#214491',
  '#2c5f7d',
  'var(--ion-color-emerald)',
  'var(--ion-color-prussian-blue)',
  'var(--ion-color-purple-heart)',
  'var(--ion-color-amethyst)',
] as const;

/** Stable palette pick from a string id (same seed → same color). */
export function resolveAvatarBackgroundColor(seed: string): string {
  const key = seed.trim();
  if (!key) {
    return APP_AVATAR_PALETTE[0];
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return APP_AVATAR_PALETTE[Math.abs(hash) % APP_AVATAR_PALETTE.length];
}
