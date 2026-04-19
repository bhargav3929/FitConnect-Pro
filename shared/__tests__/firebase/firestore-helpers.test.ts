import { describe, it, expect, vi } from 'vitest';

// Mock firebase/firestore before importing
vi.mock('firebase/firestore', () => {
    class MockTimestamp {
        seconds: number;
        nanoseconds: number;
        constructor(seconds: number, nanoseconds: number) {
            this.seconds = seconds;
            this.nanoseconds = nanoseconds;
        }
        toDate() {
            return new Date(this.seconds * 1000);
        }
        static fromDate(date: Date) {
            return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
        }
    }
    return {
        Timestamp: MockTimestamp,
        doc: vi.fn(),
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        onSnapshot: vi.fn(),
        getDocs: vi.fn(),
    };
});

vi.mock('../../src/firebase/config', () => ({
    db: {},
    auth: { currentUser: null },
}));

vi.mock('../../src/firebase/api-config', () => ({
    getApiBaseUrl: () => '',
}));

import { toDate, convertTimestamps } from '../../src/firebase/firestore';
import { Timestamp } from 'firebase/firestore';

describe('toDate', () => {
    it('converts Firestore Timestamp to Date', () => {
        const ts = new Timestamp(1700000000, 0);
        const result = toDate(ts);
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBe(1700000000 * 1000);
    });

    it('passes through Date instances unchanged', () => {
        const date = new Date('2024-01-15T10:00:00Z');
        const result = toDate(date);
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBe(date.getTime());
    });

    it('converts ISO date string to Date', () => {
        const result = toDate('2024-06-15T12:00:00Z');
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe('2024-06-15T12:00:00.000Z');
    });

    it('converts numeric timestamp to Date', () => {
        const result = toDate(1700000000000);
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBe(1700000000000);
    });

    it('returns current date for undefined/null/unknown', () => {
        const before = Date.now();
        const result = toDate(undefined);
        const after = Date.now();
        expect(result.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.getTime()).toBeLessThanOrEqual(after);
    });
});

describe('convertTimestamps', () => {
    it('converts Timestamp fields in an object', () => {
        const ts = new Timestamp(1700000000, 0);
        const data = { name: 'Test', createdAt: ts, count: 5 };
        const result = convertTimestamps(data);

        expect(result.name).toBe('Test');
        expect(result.count).toBe(5);
        expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('leaves non-Timestamp fields unchanged', () => {
        const data = { name: 'Test', active: true, tags: ['a', 'b'] };
        const result = convertTimestamps(data);
        expect(result).toEqual(data);
    });

    it('handles empty object', () => {
        const result = convertTimestamps({});
        expect(result).toEqual({});
    });

    it('does not modify the original object', () => {
        const ts = new Timestamp(1700000000, 0);
        const original = { createdAt: ts };
        convertTimestamps(original);
        expect(original.createdAt).toBe(ts);
    });
});
