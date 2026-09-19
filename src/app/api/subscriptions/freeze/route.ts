import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { recordSubscriptionEvent, subscriptionChanges } from '@/lib/subscription-events';
import { classStartAtStudio } from '@fitconnect/shared/schedule/class-time';
import { STUDIO_UTC_OFFSET_MINUTES, studioDayKey } from '@fitconnect/shared/schedule/studio-day';
import {
    FREEZE_INELIGIBLE_MESSAGES,
    FREEZE_MAX_DAYS,
    FREEZE_MAX_LEAD_DAYS,
    FREEZE_MIN_DAYS,
    addDays,
    getFreezeIneligibleReason,
    hasOpenFreeze,
} from '@fitconnect/shared/subscriptions/policy';

// ---------------------------------------------------------------------------
// POST   - freeze the caller's plan for FREEZE_MIN_DAYS..FREEZE_MAX_DAYS days.
// DELETE - end an open freeze early and hand back the unused days.
//
// A freeze covers whole studio days. The plan's endDate moves out by the frozen
// days, bookings inside the window are cancelled with their credits returned,
// and new bookings inside it are refused. Razorpay billing is not touched: the
// days are carried as accessOffsetDays and added to every renewal's end date.
//
// Admins may pass `userId` to act for a member; the once-a-year limit does not
// apply to them.
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

type HttpError = { status: number; error: string; code: string };

function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** 00:00 at the studio on the given YYYY-MM-DD. */
/** A studio-local calendar date for ledger reasons, e.g. "2 Jan 2027". */
function formatStudioDate(date: Date): string {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function studioMidnight(dayKey: string): Date {
    const [y, m, d] = dayKey.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d) - STUDIO_UTC_OFFSET_MINUTES * 60_000);
}

async function resolveCaller(req: NextRequest, body: Record<string, unknown>) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw { status: 401, error: 'Must be logged in', code: 'unauthenticated' } satisfies HttpError;
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    const isAdmin = decoded.admin === true;
    const requested = typeof body.userId === 'string' && body.userId ? body.userId : null;
    if (requested && requested !== decoded.uid && !isAdmin) {
        throw { status: 403, error: 'Admin access required', code: 'permission-denied' } satisfies HttpError;
    }
    return { actorId: decoded.uid, userId: requested ?? decoded.uid, isAdmin, actingForMember: !!requested && requested !== decoded.uid };
}

async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
    try {
        const body = await req.json();
        return body && typeof body === 'object' ? body as Record<string, unknown> : {};
    } catch {
        return {};
    }
}

function errorResponse(error: unknown, fallback: string) {
    if (error && typeof error === 'object' && 'status' in error) {
        const e = error as HttpError;
        return NextResponse.json({ error: e.error, code: e.code }, { status: e.status });
    }
    console.error(`[freeze] ${fallback}:`, error);
    return NextResponse.json({ error: fallback, code: 'internal' }, { status: 500 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await readBody(req);
        const { actorId, userId, isAdmin, actingForMember } = await resolveCaller(req, body);

        const { startDate, days } = body;
        if (typeof startDate !== 'string' || !DATE_KEY_RE.test(startDate)) {
            return NextResponse.json({ error: 'startDate must be YYYY-MM-DD', code: 'invalid-argument' }, { status: 400 });
        }
        if (typeof days !== 'number' || !Number.isInteger(days) || days < FREEZE_MIN_DAYS || days > FREEZE_MAX_DAYS) {
            return NextResponse.json(
                { error: `A freeze must be between ${FREEZE_MIN_DAYS} and ${FREEZE_MAX_DAYS} days`, code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const now = new Date();
        const todayKey = studioDayKey(now);
        const freezeStart = studioMidnight(startDate);
        const freezeEnd = addDays(freezeStart, days);
        const endKey = studioDayKey(freezeEnd);

        if (startDate < todayKey) {
            return NextResponse.json({ error: 'A freeze cannot start in the past', code: 'invalid-argument' }, { status: 400 });
        }
        if (freezeStart.getTime() > studioMidnight(todayKey).getTime() + FREEZE_MAX_LEAD_DAYS * DAY_MS) {
            return NextResponse.json(
                { error: `A freeze can be scheduled at most ${FREEZE_MAX_LEAD_DAYS} days ahead`, code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const userRef = adminDb.collection('users').doc(userId);

        const result = await adminDb.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw { status: 404, error: 'Member not found', code: 'not-found' } satisfies HttpError;
            const subscription = (userDoc.data()!.subscription ?? {}) as Record<string, unknown>;

            const endDate = toDate(subscription.endDate);
            const reason = getFreezeIneligibleReason({
                status: String(subscription.status ?? ''),
                planId: (subscription.planId as string | null) ?? null,
                endDate,
                freezeStartDate: toDate(subscription.freezeStartDate),
                freezeEndDate: toDate(subscription.freezeEndDate),
                // Admins can grant an extra freeze outside the yearly limit.
                lastFreezeRequestedAt: isAdmin ? null : toDate(subscription.lastFreezeRequestedAt),
            }, now);
            if (reason) throw { status: 409, error: FREEZE_INELIGIBLE_MESSAGES[reason], code: `freeze-${reason}` } satisfies HttpError;
            if (freezeStart.getTime() >= endDate!.getTime()) {
                throw { status: 400, error: 'A freeze must start before your plan ends', code: 'invalid-argument' } satisfies HttpError;
            }

            // Confirmed bookings for classes inside the window that have not started yet.
            const bookingsSnap = await transaction.get(
                adminDb.collection('bookings').where('userId', '==', userId).where('status', '==', 'confirmed'),
            );
            const candidates = bookingsSnap.docs.filter((doc) => {
                const classDate = toDate(doc.data().classDate);
                if (!classDate) return false;
                const key = studioDayKey(classDate);
                return key >= startDate && key < endKey;
            });
            const classDocs = new Map<string, DocumentSnapshot>();
            for (const doc of candidates) {
                const classId = doc.data().classId;
                if (typeof classId === 'string' && classId && !classDocs.has(classId)) {
                    classDocs.set(classId, await transaction.get(adminDb.collection('classes').doc(classId)));
                }
            }
            const affected = candidates.filter((doc) => {
                const classDoc = classDocs.get(doc.data().classId);
                if (!classDoc?.exists) return true;
                const cd = classDoc.data()!;
                const start = classStartAtStudio(toDate(cd.date) ?? new Date(NaN), cd.startTime);
                return !start || start.getTime() > now.getTime();
            });

            const serverNow = FieldValue.serverTimestamp();
            const restored = { classes: 0, intro: 0, guest: 0 };
            for (const doc of affected) {
                const booking = doc.data();
                transaction.update(doc.ref, {
                    status: 'canceled',
                    canceledAt: serverNow,
                    canceledReason: 'plan-frozen',
                    updatedAt: serverNow,
                });
                const classDoc = classDocs.get(booking.classId);
                if (classDoc?.exists) {
                    transaction.update(classDoc.ref, {
                        bookedCount: FieldValue.increment(-1),
                        ...(typeof booking.spotNumber === 'number' ? { bookedSpots: FieldValue.arrayRemove(booking.spotNumber) } : {}),
                        updatedAt: serverNow,
                    });
                }
                const creditType = booking.creditType || 'standard';
                if (booking.usedGuestPass === true || creditType === 'guest_pass') restored.guest += 1;
                else if (creditType === 'intro_credit') restored.intro += 1;
                else if (creditType === 'standard') restored.classes += 1;
            }

            const offset = typeof subscription.accessOffsetDays === 'number' ? subscription.accessOffsetDays : 0;
            const newEndDate = addDays(endDate!, days);
            const userUpdate: Record<string, unknown> = {
                'subscription.freezeStartDate': freezeStart,
                'subscription.freezeEndDate': freezeEnd,
                'subscription.freezeDays': days,
                'subscription.lastFreezeRequestedAt': now,
                'subscription.endDate': newEndDate,
                ...(subscription.razorpaySubscriptionId ? { 'subscription.accessOffsetDays': offset + days } : {}),
                ...(restored.classes && subscription.classesRemaining !== null
                    ? { 'subscription.classesRemaining': FieldValue.increment(restored.classes) } : {}),
                ...(restored.intro ? { 'subscription.introCreditRemaining': FieldValue.increment(restored.intro) } : {}),
                ...(restored.guest ? { 'subscription.guestPassesRemaining': FieldValue.increment(restored.guest) } : {}),
                updatedAt: serverNow,
            };
            transaction.update(userRef, userUpdate);
            recordSubscriptionEvent(transaction, {
                userId,
                action: 'plan-frozen',
                source: actingForMember ? 'admin' : 'member',
                reason: `Plan frozen for ${days} days from ${formatStudioDate(freezeStart)}; access now ends ${formatStudioDate(newEndDate)}`
                    + (affected.length ? `; ${affected.length} booking(s) in the window cancelled with credits returned` : ''),
                actorId,
                razorpaySubscriptionId: (subscription.razorpaySubscriptionId as string | undefined) ?? null,
                before: subscription,
                changes: subscriptionChanges(userUpdate),
                metadata: { route: 'subscriptions/freeze', canceledBookingIds: affected.map((d) => d.id) },
            });

            return { freezeStartDate: freezeStart.toISOString(), freezeEndDate: freezeEnd.toISOString(), endDate: newEndDate.toISOString(), canceledBookings: affected.length };
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return errorResponse(error, 'Failed to freeze plan');
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await readBody(req);
        const { actorId, userId, actingForMember } = await resolveCaller(req, body);
        const userRef = adminDb.collection('users').doc(userId);
        const now = new Date();

        const result = await adminDb.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw { status: 404, error: 'Member not found', code: 'not-found' } satisfies HttpError;
            const subscription = (userDoc.data()!.subscription ?? {}) as Record<string, unknown>;

            const freezeStart = toDate(subscription.freezeStartDate);
            const freezeEnd = toDate(subscription.freezeEndDate);
            const endDate = toDate(subscription.endDate);
            if (!freezeStart || !freezeEnd || !endDate || !hasOpenFreeze({ freezeStartDate: freezeStart, freezeEndDate: freezeEnd }, now)) {
                throw { status: 409, error: 'There is no freeze to end', code: 'failed-precondition' } satisfies HttpError;
            }

            // The member can book again from the start of today at the studio.
            const resumeAt = new Date(Math.max(freezeStart.getTime(), studioMidnight(studioDayKey(now)).getTime()));
            const unusedDays = Math.round((freezeEnd.getTime() - resumeAt.getTime()) / DAY_MS);
            const usedDays = Math.round((resumeAt.getTime() - freezeStart.getTime()) / DAY_MS);
            const offset = typeof subscription.accessOffsetDays === 'number' ? subscription.accessOffsetDays : 0;
            const newEndDate = addDays(endDate, -unusedDays);

            const userUpdate: Record<string, unknown> = usedDays === 0
                ? {
                    // Nothing was used, so it is as if the freeze never happened.
                    'subscription.freezeStartDate': null,
                    'subscription.freezeEndDate': null,
                    'subscription.freezeDays': 0,
                    'subscription.lastFreezeRequestedAt': null,
                }
                : {
                    'subscription.freezeEndDate': resumeAt,
                    'subscription.freezeDays': usedDays,
                };
            userUpdate['subscription.endDate'] = newEndDate;
            if (subscription.razorpaySubscriptionId) {
                userUpdate['subscription.accessOffsetDays'] = Math.max(0, offset - unusedDays);
            }
            userUpdate.updatedAt = FieldValue.serverTimestamp();

            transaction.update(userRef, userUpdate);
            recordSubscriptionEvent(transaction, {
                userId,
                action: 'plan-unfrozen',
                source: actingForMember ? 'admin' : 'member',
                reason: usedDays === 0
                    ? `Scheduled freeze withdrawn; access ends ${formatStudioDate(newEndDate)}`
                    : `Freeze ended early after ${usedDays} day(s); ${unusedDays} unused day(s) handed back, access ends ${formatStudioDate(newEndDate)}`,
                actorId,
                razorpaySubscriptionId: (subscription.razorpaySubscriptionId as string | undefined) ?? null,
                before: subscription,
                changes: subscriptionChanges(userUpdate),
                metadata: { route: 'subscriptions/freeze', unusedDays, usedDays },
            });

            return { endDate: newEndDate.toISOString(), usedDays, unusedDays };
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return errorResponse(error, 'Failed to end freeze');
    }
}
