// ---------------------------------------------------------------------------
// Studio membership policy rules shared by web, mobile and the API routes.
// The wording members read lives on /policies; keep the numbers here in sync.
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/** Longest single freeze a member can take. */
export const FREEZE_MAX_DAYS = 30;
/** Shortest freeze worth taking; shorter gaps are handled by just not booking. */
export const FREEZE_MIN_DAYS = 7;
/** A freeze can be requested at most once in this many days. */
export const FREEZE_COOLDOWN_DAYS = 365;
/** How far ahead a freeze can be scheduled to start. */
export const FREEZE_MAX_LEAD_DAYS = 30;

/** Notice required before the next billing date for a cancellation to stop that charge. */
export const CANCELLATION_NOTICE_DAYS = 14;

/** Members cannot cancel a booking inside this many hours of class start. */
export const BOOKING_CANCELLATION_WINDOW_HOURS = 12;

export interface FreezeState {
    freezeStartDate?: Date | null;
    freezeEndDate?: Date | null;
}

export interface FreezeEligibilityInput extends FreezeState {
    status: string;
    planId: string | null;
    endDate: Date | null;
    lastFreezeRequestedAt?: Date | null;
}

export type FreezeIneligibleReason =
    | 'no-active-plan'
    | 'demo-plan'
    | 'already-frozen'
    | 'cooldown';

export function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * DAY_MS);
}

/** True when the given instant falls inside the member's freeze window. */
export function isFrozenAt(state: FreezeState, at: Date): boolean {
    const start = state.freezeStartDate;
    const end = state.freezeEndDate;
    if (!start || !end) return false;
    return at.getTime() >= start.getTime() && at.getTime() < end.getTime();
}

/** True when a freeze is scheduled or in progress (its end is still ahead). */
export function hasOpenFreeze(state: FreezeState, now: Date = new Date()): boolean {
    return !!state.freezeEndDate && state.freezeEndDate.getTime() > now.getTime();
}

/** The date a member may next request a freeze, or null when they can now. */
export function nextFreezeAvailableAt(lastFreezeRequestedAt: Date | null | undefined, now: Date = new Date()): Date | null {
    if (!lastFreezeRequestedAt) return null;
    const next = addDays(lastFreezeRequestedAt, FREEZE_COOLDOWN_DAYS);
    return next.getTime() > now.getTime() ? next : null;
}

export function getFreezeIneligibleReason(
    sub: FreezeEligibilityInput,
    now: Date = new Date(),
): FreezeIneligibleReason | null {
    if (sub.status !== 'active' || !sub.planId || !sub.endDate || sub.endDate.getTime() <= now.getTime()) {
        return 'no-active-plan';
    }
    if (sub.planId === 'drop_in') return 'demo-plan';
    if (hasOpenFreeze(sub, now)) return 'already-frozen';
    if (nextFreezeAvailableAt(sub.lastFreezeRequestedAt, now)) return 'cooldown';
    return null;
}

export const FREEZE_INELIGIBLE_MESSAGES: Record<FreezeIneligibleReason, string> = {
    'no-active-plan': 'You need an active plan to freeze it.',
    'demo-plan': 'The Demo Class cannot be frozen.',
    'already-frozen': 'Your plan already has a freeze scheduled or in progress.',
    'cooldown': `A plan can be frozen once every ${FREEZE_COOLDOWN_DAYS / 365 === 1 ? '12 months' : `${FREEZE_COOLDOWN_DAYS} days`}.`,
};

/**
 * Whether cancelling now still gives the required notice before the next charge.
 * With less notice, the next charge still happens and the membership ends after it.
 */
export function meetsCancellationNotice(nextChargeAt: Date | null, now: Date = new Date()): boolean {
    if (!nextChargeAt) return true;
    return nextChargeAt.getTime() - now.getTime() >= CANCELLATION_NOTICE_DAYS * DAY_MS;
}
