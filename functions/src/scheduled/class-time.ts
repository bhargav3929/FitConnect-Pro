import { Timestamp } from 'firebase-admin/firestore';

const STUDIO_UTC_OFFSET_MINUTES = 330;

function toDate(value: unknown): Date | null {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function getClassEnd(dateValue: unknown, startTime: unknown, durationMinutes: unknown): Date | null {
    const classDate = toDate(dateValue);
    if (!classDate || typeof startTime !== 'string') return null;
    const match = startTime.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;

    const studioDate = new Date(classDate.getTime() + STUDIO_UTC_OFFSET_MINUTES * 60_000);
    const start = Date.UTC(
        studioDate.getUTCFullYear(),
        studioDate.getUTCMonth(),
        studioDate.getUTCDate(),
        hours,
        minutes,
    ) - STUDIO_UTC_OFFSET_MINUTES * 60_000;
    const duration = typeof durationMinutes === 'number' && durationMinutes > 0 ? durationMinutes : 60;
    return new Date(start + duration * 60_000);
}
