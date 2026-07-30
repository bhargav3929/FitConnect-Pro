/**
 * Scheduling conflict rules for classes.
 *
 * Class start times are free-form, so two classes can overlap without sharing a
 * start time. A bare `startTime === startTime` check misses that entirely: an
 * 08:00 class running 50 minutes and an 08:30 class in the same room is a real
 * double-booking. These helpers compare full time intervals instead.
 *
 * A conflict requires both an interval overlap AND a shared resource — the same
 * room, or the same trainer. Two classes at the same moment in different rooms
 * with different trainers are legitimate and allowed.
 *
 * Pure functions only, so both the Next API routes and tests can use them.
 * `functions/src/api/schedule-conflicts.ts` mirrors this logic for the Cloud
 * Functions build, which cannot resolve this package — keep the two in step.
 */

export interface ScheduledClassWindow {
    id: string;
    /** Calendar day the class belongs to; time-of-day is ignored. */
    date: Date;
    /** "HH:MM", 24-hour. */
    startTime: string;
    /** Minutes. Falls back to DEFAULT_DURATION_MINUTES when missing or invalid. */
    duration: number;
    location: string;
    trainerId: string;
    classType?: string;
    status?: string;
}

export interface ClassConflict {
    /** Id of the existing class that blocks the candidate. */
    conflictsWith: string;
    /** Which shared resource is contended. */
    reason: 'location' | 'trainer';
    location: string;
    classType: string;
    /** "HH:MM" bounds of the existing class, for the error message. */
    startTime: string;
    endTime: string;
}

export const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_LOCATION = 'Main Studio';

function parseHhMm(startTime: string): number {
    const [rawHours, rawMinutes] = String(startTime ?? '').split(':');
    const hours = Number.parseInt(rawHours, 10);
    const minutes = Number.parseInt(rawMinutes, 10);
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

function formatHhMm(totalMinutes: number): string {
    const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
    const hours = Math.floor(wrapped / 60);
    const minutes = wrapped % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeLocation(location: string | undefined): string {
    return (location ?? DEFAULT_LOCATION).trim().toLowerCase();
}

function effectiveDuration(duration: unknown): number {
    return typeof duration === 'number' && duration > 0 ? duration : DEFAULT_DURATION_MINUTES;
}

/**
 * Absolute [start, end) in epoch milliseconds. Anchoring to local midnight and
 * adding the offset means a class running past midnight simply extends into the
 * next day rather than wrapping, so cross-midnight overlaps compare correctly.
 */
export function classInterval(window: ScheduledClassWindow): { start: number; end: number } {
    const midnight = new Date(window.date);
    midnight.setHours(0, 0, 0, 0);
    const start = midnight.getTime() + parseHhMm(window.startTime) * 60_000;
    return { start, end: start + effectiveDuration(window.duration) * 60_000 };
}

/**
 * First existing class that contends with `candidate`, or null when the slot is
 * free. Canceled classes and the candidate's own id are ignored.
 */
export function findClassConflict(
    candidate: ScheduledClassWindow,
    existing: ScheduledClassWindow[],
): ClassConflict | null {
    const slot = classInterval(candidate);
    const candidateLocation = normalizeLocation(candidate.location);

    for (const other of existing) {
        if (other.id === candidate.id) continue;
        if (other.status === 'canceled') continue;

        const otherSlot = classInterval(other);
        // Half-open intervals: a class ending exactly as the next begins is fine.
        if (slot.start >= otherSlot.end || otherSlot.start >= slot.end) continue;

        const sameLocation = normalizeLocation(other.location) === candidateLocation;
        const sameTrainer = Boolean(other.trainerId) && other.trainerId === candidate.trainerId;
        if (!sameLocation && !sameTrainer) continue;

        const otherStart = parseHhMm(other.startTime);
        return {
            conflictsWith: other.id,
            reason: sameLocation ? 'location' : 'trainer',
            location: other.location ?? DEFAULT_LOCATION,
            classType: other.classType ?? 'Class',
            startTime: formatHhMm(otherStart),
            endTime: formatHhMm(otherStart + effectiveDuration(other.duration)),
        };
    }

    return null;
}

/** Admin-facing message explaining why a slot was refused. */
export function describeClassConflict(conflict: ClassConflict): string {
    const span = `${conflict.startTime}-${conflict.endTime}`;
    return conflict.reason === 'location'
        ? `${conflict.location} is already booked ${span} by ${conflict.classType}. Choose another time or location.`
        : `This trainer is already teaching ${conflict.classType} ${span}. Choose another time or trainer.`;
}
