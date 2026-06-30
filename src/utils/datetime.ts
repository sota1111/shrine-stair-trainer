// JST (Asia/Tokyo, UTC+9) date/time helpers.
// These intentionally do NOT rely on the host machine's timezone so that records are
// always stamped with the Japan-local calendar date and time-of-day, regardless of where
// the app (browser or server build) runs.
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** JST calendar date "YYYY-MM-DD" for the given instant (default: now). */
export function jstDateString(d: Date = new Date()): string {
  return new Date(d.getTime() + JST_OFFSET_MS).toISOString().split('T')[0];
}

/** JST time-of-day "HH:MM" for the given instant (default: now). */
export function jstTimeString(d: Date = new Date()): string {
  const j = new Date(d.getTime() + JST_OFFSET_MS);
  return `${String(j.getUTCHours()).padStart(2, '0')}:${String(j.getUTCMinutes()).padStart(2, '0')}`;
}

const DOW = ['日', '月', '火', '水', '木', '金', '土'];

/** Weekday character ("日".."土") for a "YYYY-MM-DD" string, timezone-independent. */
export function dayOfWeekOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
