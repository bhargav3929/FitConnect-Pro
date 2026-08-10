// A class belongs to a calendar day *at the studio*, not on whatever device is
// looking at it. The studio is in Asia/Kolkata (UTC+05:30, no DST ever), so a
// fixed offset is exact and avoids depending on Intl timezone data, which Hermes
// on Android does not reliably ship.
//
// Two write conventions exist in `classes.date`:
//   • 00:00:00 UTC — written by createClass, which does new Date('YYYY-MM-DD')
//   • 18:30:00 UTC — legacy seeded data, i.e. 00:00 IST of the following UTC day
// Both resolve to the intended day once the timestamp is read in studio time.
//
// Never bound a day query with device-local midnight: on any device below
// UTC+05:30 (UK, the Americas) the window skips past the stored timestamp and
// the day reads back as "no classes scheduled".

export const STUDIO_UTC_OFFSET_MINUTES = 330;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The calendar day a stored class timestamp falls on at the studio, as YYYY-MM-DD. */
export function studioDayKey(date: Date): string {
    return new Date(date.getTime() + STUDIO_UTC_OFFSET_MINUTES * 60_000)
        .toISOString()
        .slice(0, 10);
}

/** The YYYY-MM-DD the user is looking at in the calendar strip, read off the device clock. */
export function calendarDayKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * A UTC window guaranteed to contain the picked day under every write convention
 * and every device timezone. Results still need narrowing with isOnStudioDay —
 * the window deliberately overshoots into the neighbouring days.
 */
export function studioDayQueryWindow(date: Date): { start: Date; end: Date } {
    const [year, month, day] = calendarDayKey(date).split('-').map(Number);
    const midnightUtc = Date.UTC(year, month - 1, day);
    return {
        start: new Date(midnightUtc - DAY_MS),
        end: new Date(midnightUtc + DAY_MS),
    };
}

/** True when a stored class timestamp lands on the day the user picked. */
export function isOnStudioDay(classDate: Date, selectedDate: Date): boolean {
    return studioDayKey(classDate) === calendarDayKey(selectedDate);
}

/** Orders classes within a day by wall-clock start time ("HH:mm"). */
export function byStartTime(a: { startTime?: string }, b: { startTime?: string }): number {
    return (a.startTime || '').localeCompare(b.startTime || '');
}
