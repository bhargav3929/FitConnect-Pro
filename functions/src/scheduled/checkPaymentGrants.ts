import * as functions from 'firebase-functions';
import { db } from '../init';
import { recordSubscriptionEvent } from '../lib/subscriptionEvents';

/**
 * Daily audit: every succeeded payment must be reflected on the member's
 * subscription. A member who paid but shows "No Plan" is exactly the failure
 * we saw when a replayed onUserCreate event reset paid subscriptions to
 * defaults, and it was only noticed when the member complained.
 *
 * Reports go to Cloud Logging as errors and, when configured, by email.
 * Configure in functions/.env (see functions/.env.example):
 *   RESEND_API_KEY      Resend API key
 *   RESEND_FROM         verified sender, e.g. "Sol Pilates <alerts@solpilatesstudio.in>"
 *   ADMIN_ALERT_EMAIL   where mismatch reports go
 */

const LOOKBACK_DAYS = 90;

interface Mismatch {
    paymentId: string;
    userId: string;
    email: string;
    planId: string;
    paidAt: string;
    reason: string;
}

function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const maybe = value as { toDate?: () => Date };
    if (typeof maybe.toDate === 'function') return maybe.toDate();
    const d = new Date(value as string | number);
    return Number.isNaN(d.getTime()) ? null : d;
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function findPaymentGrantMismatches(now = new Date()): Promise<Mismatch[]> {
    const since = new Date(now);
    since.setDate(since.getDate() - LOOKBACK_DAYS);

    // Single-field filter only, so no composite index is needed; the lookback
    // window is applied in code because the collection is small.
    const payments = await db.collection('payments').where('status', '==', 'succeeded').get();

    // Only the most recent payment per member has to be reflected on the
    // subscription; an older one is legitimately superseded.
    const latestByUser = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    for (const doc of payments.docs) {
        const userId = doc.data().userId;
        if (typeof userId !== 'string' || !userId) continue;
        const paidAt = toDate(doc.data().paidAt)?.getTime() ?? 0;
        if (paidAt < since.getTime()) continue;
        const current = latestByUser.get(userId);
        const currentPaidAt = current ? (toDate(current.data().paidAt)?.getTime() ?? 0) : -1;
        if (paidAt > currentPaidAt) latestByUser.set(userId, doc);
    }

    const mismatches: Mismatch[] = [];

    for (const [userId, paymentDoc] of latestByUser) {
        const payment = paymentDoc.data();
        const paidAt = toDate(payment.paidAt);
        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();
        const subscription = (user?.subscription ?? {}) as Record<string, unknown>;
        const endDate = toDate(subscription.endDate);

        const base = {
            paymentId: paymentDoc.id,
            userId,
            email: typeof user?.email === 'string' ? user.email : '(unknown)',
            planId: String(payment.planId ?? ''),
            paidAt: paidAt?.toISOString() ?? '',
        };

        if (!userDoc.exists) {
            mismatches.push({ ...base, reason: 'user document missing' });
            continue;
        }
        if (subscription.lastPaymentId !== paymentDoc.id) {
            mismatches.push({ ...base, reason: `subscription.lastPaymentId is ${String(subscription.lastPaymentId)}, expected this payment` });
            continue;
        }
        if (subscription.status !== 'active' && endDate && endDate > now) {
            mismatches.push({ ...base, reason: `status is ${String(subscription.status)} but plan runs until ${endDate.toISOString()}` });
            continue;
        }
        if (!subscription.planId) {
            mismatches.push({ ...base, reason: 'subscription.planId is empty' });
        }
    }

    return mismatches;
}

async function emailReport(mismatches: Mismatch[]): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const to = process.env.ADMIN_ALERT_EMAIL;
    if (!apiKey || !from || !to) {
        console.warn('[payment-audit] RESEND_API_KEY / RESEND_FROM / ADMIN_ALERT_EMAIL not set; report logged only');
        return;
    }

    const rows = mismatches
        .map((m) => `<tr><td>${escapeHtml(m.email)}</td><td>${escapeHtml(m.planId)}</td><td>${escapeHtml(m.paidAt)}</td><td>${escapeHtml(m.reason)}</td><td>${escapeHtml(m.paymentId)}</td></tr>`)
        .join('');
    const html = `<p>${mismatches.length} paid member(s) whose subscription does not match their latest payment:</p>`
        + `<table border="1" cellpadding="6"><tr><th>Member</th><th>Plan</th><th>Paid at</th><th>Problem</th><th>Payment</th></tr>${rows}</table>`;

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from,
            to: [to],
            subject: `[Sol Pilates] ${mismatches.length} paid member(s) missing their plan`,
            html,
        }),
    });
    if (!response.ok) {
        console.error('[payment-audit] Resend rejected the report:', response.status, await response.text());
    }
}

export const checkPaymentGrants = functions.pubsub
    .schedule('45 2 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        const mismatches = await findPaymentGrantMismatches();
        if (mismatches.length === 0) {
            console.log('[payment-audit] all succeeded payments are reflected on subscriptions');
            return null;
        }
        for (const m of mismatches) {
            console.error(`[payment-audit] ${m.email} paid for ${m.planId} at ${m.paidAt} (payment ${m.paymentId}): ${m.reason}`);
            await recordSubscriptionEvent(null, {
                userId: m.userId,
                action: 'audit-mismatch',
                source: 'audit',
                reason: `Daily audit: ${m.reason}`,
                paymentId: m.paymentId,
                metadata: { planId: m.planId, paidAt: m.paidAt },
            });
        }
        await emailReport(mismatches);
        return null;
    });
