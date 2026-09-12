import { describe, expect, it } from 'vitest';
import { classEndAtStudio, classStartAtStudio, hasClassEnded } from '../../src/schedule/class-time';

describe('class-time', () => {
    it('combines a UTC calendar-date class with its India studio start time', () => {
        const start = classStartAtStudio(new Date('2026-09-10T00:00:00.000Z'), '18:00');
        const end = classEndAtStudio(new Date('2026-09-10T00:00:00.000Z'), '18:00', 50);

        expect(start?.toISOString()).toBe('2026-09-10T12:30:00.000Z');
        expect(end?.toISOString()).toBe('2026-09-10T13:20:00.000Z');
    });

    it('also supports legacy dates stored as India midnight', () => {
        const end = classEndAtStudio(new Date('2026-09-09T18:30:00.000Z'), '09:00', 30);

        expect(end?.toISOString()).toBe('2026-09-10T04:00:00.000Z');
    });

    it('reports a class as ended at its end time', () => {
        const classDate = new Date('2026-09-10T00:00:00.000Z');

        expect(hasClassEnded(classDate, '18:00', 50, new Date('2026-09-10T13:19:59.000Z'))).toBe(false);
        expect(hasClassEnded(classDate, '18:00', 50, new Date('2026-09-10T13:20:00.000Z'))).toBe(true);
    });
});
