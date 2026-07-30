/**
 * Scheduling conflict rules for classes (Cloud Functions copy).
 *
 * Mirrors `shared/src/schedule/class-conflicts.ts`. The functions build is
 * standalone and cannot resolve @fitconnect/shared, so the logic is duplicated
 * here the same way isIntroClassType is. Keep the two in step.
 *
 * A conflict requires an interval overlap AND a shared resource — the same room
 * or the same trainer. Comparing full intervals rather than start times is what
 * catches an 08:30 class colliding with an 08:00 one that runs 50 minutes.
 */

export interface ScheduledClassWindow {
    id: string;
    date: Date;
    startTime: string;
    duration: number;
    location: string;
    trainerId: string;
    classType?: string;
    status?: string;
}

export interface ClassConflict {
    conflictsWith: string;
    reason: 'location' | 'trainer';
    location: string;
    classType: string;
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

export function classInterval(window: ScheduledClassWindow): { start: number; end: number } {
    const midnight = new Date(window.date);
    midnight.setHours(0, 0, 0, 0);
    const start = midnight.getTime() + parseHhMm(window.startTime) * 60_000;
    return { start, end: start + effectiveDuration(window.duration) * 60_000 };
}

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

export function describeClassConflict(conflict: ClassConflict): string {
    const span = `${conflict.startTime}-${conflict.endTime}`;
    return conflict.reason === 'location'
        ? `${conflict.location} is already booked ${span} by ${conflict.classType}. Choose another time or location.`
        : `This trainer is already teaching ${conflict.classType} ${span}. Choose another time or trainer.`;
}
