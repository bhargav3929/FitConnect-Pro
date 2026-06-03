import { describe, it, expect } from 'vitest';
import {
    mapFirebaseError,
    toSafeDate,
    normalizeSubscription,
    buildClientUser,
    makeFallbackUser,
    DEFAULT_SUBSCRIPTION,
    DEFAULT_STATS,
} from '../../src/stores/clientAuthStore.helpers';

describe('mapFirebaseError', () => {
    it('maps auth/invalid-email', () => {
        expect(mapFirebaseError('auth/invalid-email')).toBe('Please enter a valid email address.');
    });

    it('maps auth/user-disabled', () => {
        expect(mapFirebaseError('auth/user-disabled')).toBe('This account has been disabled. Contact support.');
    });

    it('maps auth/user-not-found', () => {
        expect(mapFirebaseError('auth/user-not-found')).toBe('No account found with this email.');
    });

    it('maps auth/wrong-password', () => {
        expect(mapFirebaseError('auth/wrong-password')).toBe('Incorrect password. Please try again.');
    });

    it('maps auth/invalid-credential', () => {
        expect(mapFirebaseError('auth/invalid-credential')).toBe('Invalid email or password. Please try again.');
    });

    it('maps auth/email-already-in-use', () => {
        expect(mapFirebaseError('auth/email-already-in-use')).toBe('An account with this email already exists.');
    });

    it('maps auth/weak-password', () => {
        expect(mapFirebaseError('auth/weak-password')).toBe('Password must be at least 6 characters.');
    });

    it('maps auth/too-many-requests', () => {
        expect(mapFirebaseError('auth/too-many-requests')).toBe('Too many failed attempts. Please try again later.');
    });

    it('maps auth/network-request-failed', () => {
        expect(mapFirebaseError('auth/network-request-failed')).toBe('Network error. Check your connection.');
    });

    it('returns generic message for unknown code', () => {
        expect(mapFirebaseError('auth/unknown-error')).toBe('An unexpected error occurred. Please try again.');
        expect(mapFirebaseError('')).toBe('An unexpected error occurred. Please try again.');
        expect(mapFirebaseError('something-random')).toBe('An unexpected error occurred. Please try again.');
    });
});

describe('toSafeDate', () => {
    it('returns null for falsy values', () => {
        expect(toSafeDate(null)).toBeNull();
        expect(toSafeDate(undefined)).toBeNull();
        expect(toSafeDate(0)).toBeNull();
        expect(toSafeDate('')).toBeNull();
    });

    it('handles Firestore Timestamp-like objects with toDate()', () => {
        const fakeTimestamp = {
            toDate: () => new Date('2024-06-15T10:00:00Z'),
        };
        const result = toSafeDate(fakeTimestamp);
        expect(result).toBeInstanceOf(Date);
        expect(result!.toISOString()).toBe('2024-06-15T10:00:00.000Z');
    });

    it('handles Firestore seconds format { seconds, nanoseconds }', () => {
        const secondsObj = { seconds: 1718448000, nanoseconds: 0 };
        const result = toSafeDate(secondsObj);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getTime()).toBe(1718448000 * 1000);
    });

    it('handles Date objects', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const result = toSafeDate(date);
        expect(result).toBeInstanceOf(Date);
        expect(result!.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    it('handles valid date strings', () => {
        const result = toSafeDate('2024-06-15T10:00:00Z');
        expect(result).toBeInstanceOf(Date);
        expect(result!.toISOString()).toBe('2024-06-15T10:00:00.000Z');
    });

    it('handles numeric timestamps', () => {
        const result = toSafeDate(1718448000000);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getTime()).toBe(1718448000000);
    });

    it('returns null for invalid date strings', () => {
        expect(toSafeDate('not-a-date')).toBeNull();
    });

    it('returns null for unrecognized types', () => {
        expect(toSafeDate({})).toBeNull();
        expect(toSafeDate([])).toBeNull();
        expect(toSafeDate(true)).toBeNull();
    });
});

describe('normalizeSubscription', () => {
    it('returns DEFAULT_SUBSCRIPTION when raw is undefined', () => {
        const result = normalizeSubscription(undefined);
        expect(result).toEqual(DEFAULT_SUBSCRIPTION);
    });

    it('returns DEFAULT_SUBSCRIPTION values for empty object', () => {
        const result = normalizeSubscription({});
        expect(result.planId).toBeNull();
        expect(result.planCategory).toBeNull();
        expect(result.startDate).toBeNull();
        expect(result.endDate).toBeNull();
        expect(result.status).toBe('expired');
        expect(result.classesRemaining).toBe(0);
        expect(result.maxClassesPerDay).toBe(0);
        expect(result.weeklyClassLimit).toBe(0);
        expect(result.advanceBookingDays).toBe(0);
        expect(result.guestPassesRemaining).toBe(0);
        expect(result.lastPaymentId).toBeNull();
        expect(result.autoRenew).toBe(false);
        expect(result.razorpaySubscriptionId).toBeNull();
    });

    it('normalizes a full subscription object', () => {
        const raw = {
            planId: 'unlimited',
            planCategory: 'membership',
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T23:59:59Z',
            status: 'active',
            classesRemaining: null,
            maxClassesPerDay: 3,
            weeklyClassLimit: 3,
            advanceBookingDays: 14,
            guestPassesRemaining: 2,
            lastPaymentId: 'pay_123',
            autoRenew: true,
            razorpaySubscriptionId: 'sub_ABC',
        };
        const result = normalizeSubscription(raw);
        expect(result.planId).toBe('unlimited');
        expect(result.planCategory).toBe('membership');
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.status).toBe('active');
        expect(result.classesRemaining).toBeNull();
        expect(result.maxClassesPerDay).toBe(3);
        expect(result.weeklyClassLimit).toBe(3);
        expect(result.advanceBookingDays).toBe(14);
        expect(result.guestPassesRemaining).toBe(2);
        expect(result.lastPaymentId).toBe('pay_123');
        expect(result.autoRenew).toBe(true);
        expect(result.razorpaySubscriptionId).toBe('sub_ABC');
    });

    it('falls back to planType when planId is absent', () => {
        const raw = { planType: 'twice_weekly' };
        const result = normalizeSubscription(raw);
        expect(result.planId).toBe('twice_weekly');
    });

    it('does not mutate DEFAULT_SUBSCRIPTION when returning from undefined', () => {
        const result1 = normalizeSubscription(undefined);
        result1.status = 'active';
        const result2 = normalizeSubscription(undefined);
        expect(result2.status).toBe('expired');
    });
});

describe('DEFAULT_SUBSCRIPTION', () => {
    it('has correct default values', () => {
        expect(DEFAULT_SUBSCRIPTION.planId).toBeNull();
        expect(DEFAULT_SUBSCRIPTION.planCategory).toBeNull();
        expect(DEFAULT_SUBSCRIPTION.startDate).toBeNull();
        expect(DEFAULT_SUBSCRIPTION.endDate).toBeNull();
        expect(DEFAULT_SUBSCRIPTION.status).toBe('expired');
        expect(DEFAULT_SUBSCRIPTION.classesRemaining).toBe(0);
        expect(DEFAULT_SUBSCRIPTION.maxClassesPerDay).toBe(0);
        expect(DEFAULT_SUBSCRIPTION.advanceBookingDays).toBe(0);
        expect(DEFAULT_SUBSCRIPTION.guestPassesRemaining).toBe(0);
        expect(DEFAULT_SUBSCRIPTION.lastPaymentId).toBeNull();
        expect(DEFAULT_SUBSCRIPTION.autoRenew).toBe(false);
        expect(DEFAULT_SUBSCRIPTION.razorpaySubscriptionId).toBeNull();
    });
});

describe('DEFAULT_STATS', () => {
    it('has correct default values', () => {
        expect(DEFAULT_STATS.totalClassesAttended).toBe(0);
        expect(DEFAULT_STATS.currentStreak).toBe(0);
        expect(DEFAULT_STATS.longestStreak).toBe(0);
    });
});

describe('buildClientUser', () => {
    it('builds correct shape from raw data', () => {
        const data = {
            id: 'user-123',
            name: 'Jane Doe',
            email: 'jane@example.com',
            avatar: 'https://example.com/avatar.jpg',
            subscription: {
                planId: 'unlimited',
                status: 'active',
                classesRemaining: null,
                maxClassesPerDay: 3,
                weeklyClassLimit: 3,
                advanceBookingDays: 14,
                guestPassesRemaining: 2,
            },
            stats: {
                totalClassesAttended: 42,
                currentStreak: 5,
                longestStreak: 12,
            },
        };
        const result = buildClientUser('uid-abc', data);
        expect(result.id).toBe('user-123');
        expect(result.name).toBe('Jane Doe');
        expect(result.email).toBe('jane@example.com');
        expect(result.avatar).toBe('https://example.com/avatar.jpg');
        expect(result.subscription.planId).toBe('unlimited');
        expect(result.subscription.status).toBe('active');
        expect(result.stats.totalClassesAttended).toBe(42);
        expect(result.stats.currentStreak).toBe(5);
        expect(result.stats.longestStreak).toBe(12);
    });

    it('falls back to uid when data.id is missing', () => {
        const result = buildClientUser('uid-abc', {});
        expect(result.id).toBe('uid-abc');
    });

    it('uses defaults for missing fields', () => {
        const result = buildClientUser('uid-abc', {});
        expect(result.name).toBe('Member');
        expect(result.email).toBe('');
        expect(result.avatar).toBeUndefined();
        expect(result.subscription).toEqual(DEFAULT_SUBSCRIPTION);
        expect(result.stats.totalClassesAttended).toBe(0);
        expect(result.stats.currentStreak).toBe(0);
        expect(result.stats.longestStreak).toBe(0);
    });
});

describe('makeFallbackUser', () => {
    it('creates fallback user from Firebase user data', () => {
        const result = makeFallbackUser('uid-123', 'John Smith', 'john@example.com');
        expect(result.id).toBe('uid-123');
        expect(result.name).toBe('John Smith');
        expect(result.email).toBe('john@example.com');
        expect(result.subscription).toEqual(DEFAULT_SUBSCRIPTION);
        expect(result.stats).toEqual(DEFAULT_STATS);
    });

    it('handles null displayName', () => {
        const result = makeFallbackUser('uid-123', null, 'john@example.com');
        expect(result.name).toBe('Member');
    });

    it('handles null email', () => {
        const result = makeFallbackUser('uid-123', 'John', null);
        expect(result.email).toBe('');
    });

    it('handles all nulls', () => {
        const result = makeFallbackUser('uid-123', null, null);
        expect(result.name).toBe('Member');
        expect(result.email).toBe('');
    });

    it('does not share references with DEFAULT constants', () => {
        const result = makeFallbackUser('uid-1', null, null);
        result.subscription.status = 'active';
        result.stats.totalClassesAttended = 99;
        expect(DEFAULT_SUBSCRIPTION.status).toBe('expired');
        expect(DEFAULT_STATS.totalClassesAttended).toBe(0);
    });
});
