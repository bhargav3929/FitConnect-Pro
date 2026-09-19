import { describe, it, expect } from 'vitest';
import {
    CANCELLATION_NOTICE_DAYS,
    FREEZE_COOLDOWN_DAYS,
    addDays,
    getFreezeIneligibleReason,
    hasOpenFreeze,
    isFrozenAt,
    meetsCancellationNotice,
    nextFreezeAvailableAt,
} from '../../src/subscriptions/policy';

const now = new Date('2026-09-19T06:00:00Z');
const activePack = {
    status: 'active',
    planId: 'ten_class_pack',
    endDate: addDays(now, 60),
};

describe('isFrozenAt', () => {
    const window = { freezeStartDate: addDays(now, 2), freezeEndDate: addDays(now, 32) };

    it('is true from the freeze start up to, not including, its end', () => {
        expect(isFrozenAt(window, addDays(now, 2))).toBe(true);
        expect(isFrozenAt(window, addDays(now, 31))).toBe(true);
        expect(isFrozenAt(window, addDays(now, 32))).toBe(false);
        expect(isFrozenAt(window, addDays(now, 1))).toBe(false);
    });

    it('is false with no freeze', () => {
        expect(isFrozenAt({}, now)).toBe(false);
        expect(isFrozenAt({ freezeStartDate: null, freezeEndDate: null }, now)).toBe(false);
    });
});

describe('hasOpenFreeze', () => {
    it('counts scheduled and in-progress freezes, not finished ones', () => {
        expect(hasOpenFreeze({ freezeStartDate: addDays(now, 5), freezeEndDate: addDays(now, 20) }, now)).toBe(true);
        expect(hasOpenFreeze({ freezeStartDate: addDays(now, -5), freezeEndDate: addDays(now, 5) }, now)).toBe(true);
        expect(hasOpenFreeze({ freezeStartDate: addDays(now, -40), freezeEndDate: addDays(now, -10) }, now)).toBe(false);
    });
});

describe('getFreezeIneligibleReason', () => {
    it('allows an active plan that has never been frozen', () => {
        expect(getFreezeIneligibleReason(activePack, now)).toBeNull();
    });

    it('refuses without an active, unexpired plan', () => {
        expect(getFreezeIneligibleReason({ ...activePack, status: 'expired' }, now)).toBe('no-active-plan');
        expect(getFreezeIneligibleReason({ ...activePack, endDate: addDays(now, -1) }, now)).toBe('no-active-plan');
        expect(getFreezeIneligibleReason({ ...activePack, planId: null }, now)).toBe('no-active-plan');
    });

    it('refuses the demo class', () => {
        expect(getFreezeIneligibleReason({ ...activePack, planId: 'drop_in' }, now)).toBe('demo-plan');
    });

    it('refuses a second freeze while one is open', () => {
        expect(getFreezeIneligibleReason({
            ...activePack,
            freezeStartDate: addDays(now, 3),
            freezeEndDate: addDays(now, 10),
        }, now)).toBe('already-frozen');
    });

    it('allows one freeze per cooldown window', () => {
        expect(getFreezeIneligibleReason({ ...activePack, lastFreezeRequestedAt: addDays(now, -100) }, now)).toBe('cooldown');
        expect(getFreezeIneligibleReason({ ...activePack, lastFreezeRequestedAt: addDays(now, -FREEZE_COOLDOWN_DAYS - 1) }, now)).toBeNull();
    });
});

describe('nextFreezeAvailableAt', () => {
    it('is a year after the last request, or null once that has passed', () => {
        const last = addDays(now, -10);
        expect(nextFreezeAvailableAt(last, now)?.toISOString()).toBe(addDays(last, FREEZE_COOLDOWN_DAYS).toISOString());
        expect(nextFreezeAvailableAt(addDays(now, -400), now)).toBeNull();
        expect(nextFreezeAvailableAt(null, now)).toBeNull();
    });
});

describe('meetsCancellationNotice', () => {
    it(`needs ${CANCELLATION_NOTICE_DAYS} full days before the next charge`, () => {
        expect(meetsCancellationNotice(addDays(now, CANCELLATION_NOTICE_DAYS), now)).toBe(true);
        expect(meetsCancellationNotice(addDays(now, CANCELLATION_NOTICE_DAYS + 5), now)).toBe(true);
        expect(meetsCancellationNotice(addDays(now, CANCELLATION_NOTICE_DAYS - 0.5), now)).toBe(false);
        expect(meetsCancellationNotice(addDays(now, 1), now)).toBe(false);
    });

    it('treats an unknown next charge as enough notice', () => {
        expect(meetsCancellationNotice(null, now)).toBe(true);
    });
});
