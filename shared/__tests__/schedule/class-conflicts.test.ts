import { describe, it, expect } from 'vitest';
import {
    findClassConflict,
    describeClassConflict,
    type ScheduledClassWindow,
} from '../../src/schedule/class-conflicts';

const DAY = new Date(2027, 2, 15); // 15 March 2027, local

function cls(overrides: Partial<ScheduledClassWindow> & { id: string }): ScheduledClassWindow {
    return {
        date: DAY,
        startTime: '08:00',
        duration: 50,
        location: 'Main Studio',
        trainerId: 'trainer-a',
        classType: 'Sol Flow',
        status: 'scheduled',
        ...overrides,
    };
}

describe('findClassConflict', () => {
    it('allows a slot with nothing else scheduled', () => {
        expect(findClassConflict(cls({ id: 'new' }), [])).toBeNull();
    });

    it('rejects the identical start time in the same room', () => {
        const conflict = findClassConflict(cls({ id: 'new' }), [cls({ id: 'existing' })]);
        expect(conflict?.conflictsWith).toBe('existing');
        expect(conflict?.reason).toBe('location');
    });

    // The regression this module exists for: distinct start times, same room,
    // overlapping intervals. The old startTime-equality check let this through.
    it('rejects a later start that overlaps a running class', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', startTime: '08:30' }),
            [cls({ id: 'existing', startTime: '08:00', duration: 50 })],
        );
        expect(conflict?.reason).toBe('location');
        expect(conflict?.startTime).toBe('08:00');
        expect(conflict?.endTime).toBe('08:50');
    });

    it('rejects an earlier start that runs into a later class', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', startTime: '07:30', duration: 60 }),
            [cls({ id: 'existing', startTime: '08:00' })],
        );
        expect(conflict?.reason).toBe('location');
    });

    it('rejects a class fully contained in another', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', startTime: '08:10', duration: 10 }),
            [cls({ id: 'existing', startTime: '08:00', duration: 50 })],
        );
        expect(conflict).not.toBeNull();
    });

    it('allows back-to-back classes that merely touch', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', startTime: '08:50' }),
            [cls({ id: 'existing', startTime: '08:00', duration: 50 })],
        );
        expect(conflict).toBeNull();
    });

    it('allows concurrent classes in different rooms with different trainers', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', location: 'Reformer Studio', trainerId: 'trainer-b' }),
            [cls({ id: 'existing' })],
        );
        expect(conflict).toBeNull();
    });

    it('rejects the same trainer in two rooms at once', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', location: 'Reformer Studio', trainerId: 'trainer-a' }),
            [cls({ id: 'existing', location: 'Main Studio', trainerId: 'trainer-a' })],
        );
        expect(conflict?.reason).toBe('trainer');
    });

    it('ignores canceled classes', () => {
        const conflict = findClassConflict(
            cls({ id: 'new' }),
            [cls({ id: 'existing', status: 'canceled' })],
        );
        expect(conflict).toBeNull();
    });

    it('ignores the class being edited', () => {
        const conflict = findClassConflict(cls({ id: 'same' }), [cls({ id: 'same' })]);
        expect(conflict).toBeNull();
    });

    it('treats location names case- and whitespace-insensitively', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', location: '  main studio ', trainerId: 'trainer-b' }),
            [cls({ id: 'existing', location: 'Main Studio' })],
        );
        expect(conflict?.reason).toBe('location');
    });

    it('detects an overlap that runs past midnight into the next day', () => {
        const nextDay = new Date(2027, 2, 16);
        const conflict = findClassConflict(
            cls({ id: 'new', date: nextDay, startTime: '00:15', duration: 45, trainerId: 'trainer-b' }),
            [cls({ id: 'late', date: DAY, startTime: '23:30', duration: 60 })],
        );
        expect(conflict?.conflictsWith).toBe('late');
    });

    it('falls back to a 60 minute duration when the stored value is unusable', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', startTime: '08:30', trainerId: 'trainer-b' }),
            [cls({ id: 'existing', startTime: '08:00', duration: 0 })],
        );
        expect(conflict).not.toBeNull();
    });
});

describe('describeClassConflict', () => {
    it('names the room for a location clash', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', startTime: '08:30' }),
            [cls({ id: 'existing', startTime: '08:00', duration: 50 })],
        )!;
        expect(describeClassConflict(conflict)).toBe(
            'Main Studio is already booked 08:00-08:50 by Sol Flow. Choose another time or location.',
        );
    });

    it('points at the trainer for a trainer clash', () => {
        const conflict = findClassConflict(
            cls({ id: 'new', startTime: '08:30', location: 'Mat Studio' }),
            [cls({ id: 'existing', startTime: '08:00', duration: 50 })],
        )!;
        expect(describeClassConflict(conflict)).toBe(
            'This trainer is already teaching Sol Flow 08:00-08:50. Choose another time or trainer.',
        );
    });
});
