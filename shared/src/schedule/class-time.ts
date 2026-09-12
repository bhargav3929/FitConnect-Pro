import { STUDIO_UTC_OFFSET_MINUTES } from './studio-day';

const DEFAULT_DURATION_MINUTES = 60;

function parseStartTime(startTime: unknown): { hours: number; minutes: number } | null {
    if (typeof startTime !== 'string') return null;
    const match = startTime.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return { hours, minutes };
}

/**
 * Combines a stored studio calendar date and wall-clock start time into a real
 * instant. `classes.date` has two historical UTC encodings, so deriving the
 * calendar day in studio time keeps both conventions correct.
 */
export function classStartAtStudio(classDate: Date, startTime: unknown): Date | null {
    if (Number.isNaN(classDate.getTime())) return null;
    const time = parseStartTime(startTime);
    if (!time) return null;

    const studioDate = new Date(classDate.getTime() + STUDIO_UTC_OFFSET_MINUTES * 60_000);
    return new Date(Date.UTC(
        studioDate.getUTCFullYear(),
        studioDate.getUTCMonth(),
        studioDate.getUTCDate(),
        time.hours,
        time.minutes,
    ) - STUDIO_UTC_OFFSET_MINUTES * 60_000);
}

export function classEndAtStudio(
    classDate: Date,
    startTime: unknown,
    durationMinutes: unknown,
): Date | null {
    const start = classStartAtStudio(classDate, startTime);
    if (!start) return null;
    const duration = typeof durationMinutes === 'number' && durationMinutes > 0
        ? durationMinutes
        : DEFAULT_DURATION_MINUTES;
    return new Date(start.getTime() + duration * 60_000);
}

export function hasClassEnded(
    classDate: Date,
    startTime: unknown,
    durationMinutes: unknown,
    now = new Date(),
): boolean {
    const end = classEndAtStudio(classDate, startTime, durationMinutes);
    return end !== null && end <= now;
}
