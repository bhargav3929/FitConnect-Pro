import { describe, it, expect } from 'vitest';
import {
    byStartTime,
    calendarDayKey,
    isOnStudioDay,
    studioDayKey,
    studioDayQueryWindow,
} from '../../src/schedule/studio-day';

// The two conventions that actually exist in the `classes` collection.
const UTC_MIDNIGHT = new Date('2026-08-22T00:00:00.000Z'); // written by createClass
const IST_MIDNIGHT = new Date('2026-08-21T18:30:00.000Z'); // legacy seed data

// The day as the calendar strip presents it — local Y/M/D, whatever the device tz.
const PICKED_DAY = new Date(2026, 7, 22);

describe('studioDayKey', () => {
    it('reads a UTC-midnight class as its intended studio day', () => {
        expect(studioDayKey(UTC_MIDNIGHT)).toBe('2026-08-22');
    });

    it('reads a legacy IST-midnight class as its intended studio day', () => {
        expect(studioDayKey(IST_MIDNIGHT)).toBe('2026-08-22');
    });

    it('keeps late-evening studio classes on the day they are taught', () => {
        // 21:00 IST on 22 August is 15:30Z the same day.
        expect(studioDayKey(new Date('2026-08-22T15:30:00.000Z'))).toBe('2026-08-22');
    });

    it('does not roll a class into the next studio day before IST midnight', () => {
        expect(studioDayKey(new Date('2026-08-22T18:29:59.999Z'))).toBe('2026-08-22');
        expect(studioDayKey(new Date('2026-08-22T18:30:00.000Z'))).toBe('2026-08-23');
    });
});

describe('calendarDayKey', () => {
    it('reports the local calendar day the user tapped', () => {
        expect(calendarDayKey(PICKED_DAY)).toBe('2026-08-22');
    });

    it('pads single-digit months and days', () => {
        expect(calendarDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
});

describe('isOnStudioDay', () => {
    it('matches both storage conventions for the picked day', () => {
        expect(isOnStudioDay(UTC_MIDNIGHT, PICKED_DAY)).toBe(true);
        expect(isOnStudioDay(IST_MIDNIGHT, PICKED_DAY)).toBe(true);
    });

    it('rejects the neighbouring days the query window deliberately overshoots into', () => {
        expect(isOnStudioDay(new Date('2026-08-21T00:00:00.000Z'), PICKED_DAY)).toBe(false);
        expect(isOnStudioDay(new Date('2026-08-23T00:00:00.000Z'), PICKED_DAY)).toBe(false);
    });
});

describe('studioDayQueryWindow', () => {
    it('brackets the picked day in UTC, independent of the device timezone', () => {
        const { start, end } = studioDayQueryWindow(PICKED_DAY);
        expect(start.toISOString()).toBe('2026-08-21T00:00:00.000Z');
        expect(end.toISOString()).toBe('2026-08-23T00:00:00.000Z');
    });

    it('contains every class that belongs to the picked studio day', () => {
        const { start, end } = studioDayQueryWindow(PICKED_DAY);
        for (const stored of [
            IST_MIDNIGHT, // earliest possible: 00:00 IST
            UTC_MIDNIGHT,
            new Date('2026-08-22T18:29:59.999Z'), // latest possible: 23:59 IST
        ]) {
            expect(stored >= start && stored <= end).toBe(true);
            expect(isOnStudioDay(stored, PICKED_DAY)).toBe(true);
        }
    });

    it('is wide enough that a device behind UTC+05:30 still sees the day', () => {
        // The regression this guards: bounding the query with device-local midnight
        // put 2026-08-22T00:00Z outside the window on any negative-offset device,
        // and the schedule read back as "no classes scheduled".
        const { start, end } = studioDayQueryWindow(PICKED_DAY);
        const localMidnightNewYork = new Date('2026-08-22T04:00:00.000Z');
        expect(UTC_MIDNIGHT < localMidnightNewYork).toBe(true);
        expect(UTC_MIDNIGHT >= start && UTC_MIDNIGHT <= end).toBe(true);
    });
});

describe('byStartTime', () => {
    it('orders a day by wall-clock start time regardless of stored timestamp', () => {
        const day = [
            { startTime: '19:00' },
            { startTime: '08:00' },
            { startTime: '11:30' },
        ];
        expect([...day].sort(byStartTime).map((c) => c.startTime)).toEqual([
            '08:00',
            '11:30',
            '19:00',
        ]);
    });

    it('sorts classes with a missing start time first rather than throwing', () => {
        expect([{ startTime: '08:00' }, {}].sort(byStartTime)[0].startTime).toBeUndefined();
    });
});
