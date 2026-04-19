import { describe, it, expect } from 'vitest';
import { generateDays, formatDayName } from '../../components/calendarUtils';

describe('CalendarStrip helpers', () => {
    describe('generateDays', () => {
        it('generates the correct number of days', () => {
            const today = new Date(2026, 3, 9); // April 9, 2026
            const days = generateDays(today, 7);
            expect(days).toHaveLength(7);
        });

        it('starts from the given date', () => {
            const start = new Date(2026, 3, 9);
            const days = generateDays(start, 7);
            expect(days[0].getDate()).toBe(9);
            expect(days[0].getMonth()).toBe(3); // April
        });

        it('generates consecutive days', () => {
            const start = new Date(2026, 3, 9);
            const days = generateDays(start, 7);

            for (let i = 0; i < days.length; i++) {
                expect(days[i].getDate()).toBe(9 + i);
            }
        });

        it('handles month boundaries correctly', () => {
            // Start on April 28 — should cross into May
            const start = new Date(2026, 3, 28);
            const days = generateDays(start, 7);

            expect(days[0].getDate()).toBe(28); // Apr 28
            expect(days[2].getDate()).toBe(30); // Apr 30
            expect(days[3].getDate()).toBe(1);  // May 1
            expect(days[3].getMonth()).toBe(4); // May
        });

        it('sets time to midnight', () => {
            const start = new Date(2026, 3, 9, 14, 30, 45);
            const days = generateDays(start, 3);

            for (const day of days) {
                expect(day.getHours()).toBe(0);
                expect(day.getMinutes()).toBe(0);
                expect(day.getSeconds()).toBe(0);
                expect(day.getMilliseconds()).toBe(0);
            }
        });

        it('returns empty array for count of 0', () => {
            const start = new Date(2026, 3, 9);
            const days = generateDays(start, 0);
            expect(days).toHaveLength(0);
        });

        it('generates 1 day correctly', () => {
            const start = new Date(2026, 3, 9);
            const days = generateDays(start, 1);
            expect(days).toHaveLength(1);
            expect(days[0].getDate()).toBe(9);
        });
    });

    describe('formatDayName', () => {
        it('returns correct day abbreviations', () => {
            // April 9, 2026 is a Thursday
            const thursday = new Date(2026, 3, 9);
            expect(formatDayName(thursday)).toBe('Thu');

            const friday = new Date(2026, 3, 10);
            expect(formatDayName(friday)).toBe('Fri');

            const saturday = new Date(2026, 3, 11);
            expect(formatDayName(saturday)).toBe('Sat');

            const sunday = new Date(2026, 3, 12);
            expect(formatDayName(sunday)).toBe('Sun');

            const monday = new Date(2026, 3, 13);
            expect(formatDayName(monday)).toBe('Mon');

            const tuesday = new Date(2026, 3, 14);
            expect(formatDayName(tuesday)).toBe('Tue');

            const wednesday = new Date(2026, 3, 15);
            expect(formatDayName(wednesday)).toBe('Wed');
        });

        it('formats all 7 days in a generated strip', () => {
            const start = new Date(2026, 3, 12); // Sunday
            const days = generateDays(start, 7);
            const names = days.map(formatDayName);
            expect(names).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
        });
    });
});
