/** Parse comma-delimited scripture references (same format as Transformation Tools admin). */
export function parseScriptureRefs(value: string | undefined | null): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(',')
    .map((ref) => ref.trim())
    .filter(Boolean);
}
