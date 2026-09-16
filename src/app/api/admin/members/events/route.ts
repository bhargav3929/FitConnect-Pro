import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

/**
 * GET /api/admin/members/events?userId=...&limit=...
 *
 * Returns the member's subscription ledger, newest first, plus their payment
 * documents so the admin timeline can show what was paid next to what changed.
 */

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Must be logged in', code: 'unauthenticated', status: 401 };
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    if (!decoded.admin) {
        return { error: 'Admin access required', code: 'permission-denied', status: 403 };
    }
    return { uid: decoded.uid };
}

/** Firestore Timestamps become ISO strings so the payload is plain JSON. */
function serialize(value: unknown): unknown {
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(serialize);
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = serialize(v);
        return out;
    }
    return value;
}

export async function GET(req: NextRequest) {
    try {
        const authResult = await verifyAdmin(req);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error, code: authResult.code }, { status: authResult.status });
        }

        const userId = req.nextUrl.searchParams.get('userId');
        if (!userId) {
            return NextResponse.json({ error: 'userId is required', code: 'invalid-argument' }, { status: 400 });
        }
        const requestedLimit = Number(req.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT);
        const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(1, requestedLimit), MAX_LIMIT) : DEFAULT_LIMIT;

        // Single-field filter only, so no composite index has to be deployed;
        // one member has at most a few hundred rows, so sorting here is cheap.
        const [eventsSnap, paymentsSnap] = await Promise.all([
            adminDb.collection('subscriptionEvents').where('userId', '==', userId).get(),
            adminDb.collection('payments').where('userId', '==', userId).get(),
        ]);

        const events = eventsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as { id: string; createdAt?: Timestamp | null })
            .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
            .slice(0, limit)
            .map((e) => serialize(e));
        const payments = paymentsSnap.docs
            .map((d) => {
                const p = d.data();
                return serialize({
                    id: d.id,
                    planId: p.planId ?? null,
                    planName: (p.metadata as Record<string, unknown> | undefined)?.planName ?? null,
                    status: p.status ?? null,
                    amount: p.amount ?? null,
                    totalPaise: p.totalPaise ?? null,
                    currency: p.currency ?? null,
                    razorpayPaymentId: p.razorpayPaymentId ?? null,
                    razorpayOrderId: p.razorpayOrderId ?? null,
                    razorpaySubscriptionId: p.razorpaySubscriptionId ?? null,
                    grantedBy: p.grantedBy ?? null,
                    needsReview: p.needsReview === true,
                    reviewReason: p.reviewReason ?? null,
                    createdAt: p.createdAt ?? null,
                    paidAt: p.paidAt ?? null,
                });
            })
            .sort((a, b) => String((b as { createdAt: string | null }).createdAt ?? '').localeCompare(String((a as { createdAt: string | null }).createdAt ?? '')));

        return NextResponse.json({ events, payments });
    } catch (error) {
        console.error('[admin/members/events] failed:', error);
        return NextResponse.json({ error: 'Failed to load subscription events', code: 'internal' }, { status: 500 });
    }
}
