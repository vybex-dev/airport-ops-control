/**
 * timeUtils.ts — Isolated timestamp parsing utility.
 *
 * Extracted from eventIndexer.ts so that useSimClockStore can import
 * parseTimestampToMs WITHOUT transitively pulling in the static JSON
 * data imports that live in eventIndexer.ts. Keeping this file tiny
 * and free of any JSON imports is essential for initial-bundle size.
 */

/**
 * Convert "YYYY-MM-DD HH:mm:ss" (or ISO strings) to epoch milliseconds.
 * Returns 0 for null / unparseable inputs.
 */
export function parseTimestampToMs(tsStr: string): number {
  if (!tsStr) return 0;
  const formatted = tsStr.includes('T') ? tsStr : tsStr.replace(' ', 'T');
  const ms = new Date(formatted).getTime();
  return isNaN(ms) ? 0 : ms;
}
