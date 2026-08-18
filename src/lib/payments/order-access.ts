import { adminDb } from '@/lib/firebase/admin';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';

/**
 * Grants plan access for a one-time Razorpay Order (drop_in, kickstarter).
 *
 * Both the interactive checkout callback (/api/payments/verify) and the
 * order.paid / payment.captured webhook funnel through here, so the two paths
 * cannot drift. Whichever arrives first wins; the other sees 'already-granted'.
 *
 * Memberships are Subscriptions and are granted by applySubscriptionAccess in
 * the webhook instead.
 */

export interface GrantIdentity {
    name?: string;
    email?: string;
    phone?: string;
}

export type GrantOutcome =
    | {
        status: 'granted' | 'already-granted';
        planId: string;
        planName: string;
        credits: number | null;
        endDate: string;
    }
    | {
        status: 'conflict';
        code: string;
        message: string;
    };

function isActiveUnexpiredSubscription(subscription: Record<string, unknown> | undefined | null): boolean {
    if (!subscription || subscription.status !== 'active') return false;
    if (!subscription.endDate) return true;
    const endDate = subscription.endDate && typeof subscription.endDate === 'object' && 'toDate' in subscription.endDate
        ? (subscription.endDate as { toDate: () => Date }).toDate()
        : new Date((subscription.endDate as string | number | Date | undefined) || 0);
    return endDate > new Date();
}

function isActiveMembership(subscription: Record<string, unknown> | undefined | null): boolean {
    const plan = subscription?.planId ? getPlanById(subscription.planId as string) : null;
    return isActiveUnexpiredSubscription(subscription) && (subscription?.planCategory === 'membership' || plan?.category === 'membership');
}

function toIsoDate(value: unknown): string {
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate().toISOString();
    }
    const date = new Date(value as string | number | Date);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export async function grantOrderAccess(options: {
    paymentRef: DocumentReference;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    /** When set, the grant is rejected unless the payment belongs to this user. */
    expectedUserId?: string;
    identity?: GrantIdentity;
    source: string;
}): Promise<GrantOutcome> {
    const { paymentRef, razorpayPaymentId, razorpayOrderId, expectedUserId, identity, source } = options;

    return adminDb.runTransaction(async (transaction) => {
        const paymentDoc = await transaction.get(paymentRef);
        if (!paymentDoc.exists) {
            return { status: 'conflict' as const, code: 'not-found', message: 'Payment not found' };
        }

        const paymentData = paymentDoc.data()!;

        if (expectedUserId && paymentData.userId !== expectedUserId) {
            return { status: 'conflict' as const, code: 'permission-denied', message: 'Payment does not belong to you' };
        }

        const userId = paymentData.userId as string;
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            return { status: 'conflict' as const, code: 'not-found', message: 'User not found' };
        }

        const plan = getPlanById(paymentData.planId);
        if (!plan) {
            return { status: 'conflict' as const, code: 'failed-precondition', message: 'Invalid plan on payment' };
        }

        // Idempotency: the webhook and the checkout callback race by design.
        if (paymentData.status === 'succeeded') {
            if (paymentData.razorpayPaymentId === razorpayPaymentId) {
                const currentSub = userDoc.data()!.subscription as Record<string, unknown> | undefined;
                return {
                    status: 'already-granted' as const,
                    planId: plan.id,
                    planName: plan.name,
                    credits: plan.credits,
                    endDate: toIsoDate(currentSub?.endDate),
                };
            }
            return { status: 'conflict' as const, code: 'failed-precondition', message: 'Payment is already succeeded' };
        }

        if (paymentData.status !== 'pending') {
            return {
                status: 'conflict' as const,
                code: 'failed-precondition',
                message: `Payment is already ${paymentData.status}`,
            };
        }

        const currentSub = userDoc.data()!.subscription as Record<string, unknown> | undefined;
        const currentIntroCredit = typeof currentSub?.introCreditRemaining === 'number'
            ? Math.max(0, currentSub.introCreditRemaining)
            : 0;

        if (plan.category === 'membership' && isActiveUnexpiredSubscription(currentSub)) {
            return {
                status: 'conflict' as const,
                code: 'subscription-already-active',
                message: 'You already have an active membership.',
            };
        }

        if (plan.category === 'class_pack' && plan.id !== 'drop_in' && isActiveMembership(currentSub)) {
            return {
                status: 'conflict' as const,
                code: 'subscription-already-active',
                message: 'Starter packs are only available before an active membership.',
            };
        }

        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + plan.durationDays);

        transaction.update(paymentRef, {
            status: 'succeeded',
            razorpayPaymentId,
            razorpayOrderId,
            paidAt: now,
            grantedBy: source,
            updatedAt: FieldValue.serverTimestamp(),
        });

        transaction.update(userRef, {
            'subscription.planId': plan.id,
            'subscription.planCategory': plan.category,
            'subscription.startDate': now,
            'subscription.endDate': endDate,
            'subscription.status': 'active',
            'subscription.classesRemaining': plan.id === 'drop_in' ? 0 : plan.credits,
            'subscription.introCreditRemaining': plan.id === 'drop_in' ? 1 : currentIntroCredit,
            'subscription.maxClassesPerDay': plan.maxClassesPerDay,
            'subscription.weeklyClassLimit': plan.weeklyClassLimit,
            'subscription.advanceBookingDays': plan.advanceBookingDays,
            'subscription.guestPassesRemaining': plan.guestPasses,
            'subscription.lastPaymentId': paymentRef.id,
            'subscription.autoRenew': plan.autoRenew,
            updatedAt: FieldValue.serverTimestamp(),
        });

        if (plan.id === 'drop_in') {
            const metadata = paymentData.metadata as Record<string, unknown> | undefined;
            const lead = metadata?.introClassLead && typeof metadata.introClassLead === 'object'
                ? metadata.introClassLead as Record<string, unknown>
                : {};
            const leadRef = adminDb.collection('introClassLeads').doc(userId);

            transaction.set(leadRef, {
                name: typeof lead.name === 'string' ? lead.name : userDoc.data()!.name ?? identity?.name ?? '',
                email: typeof lead.email === 'string' ? lead.email : identity?.email ?? userDoc.data()!.email ?? '',
                phone: typeof lead.phone === 'string' ? lead.phone : identity?.phone ?? '',
                goals: typeof lead.goals === 'string' ? lead.goals : '',
                concerns: typeof lead.concerns === 'string' ? lead.concerns : '',
                userId,
                source: typeof lead.source === 'string' ? lead.source : 'intro-class-payment',
                status: 'new',
                paymentStatus: 'paid',
                paymentId: paymentRef.id,
                razorpayOrderId,
                razorpayPaymentId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        }

        return {
            status: 'granted' as const,
            planId: plan.id,
            planName: plan.name,
            credits: plan.credits,
            endDate: endDate.toISOString(),
        };
    });
}

/**
 * Resolves the payments doc backing a Razorpay order id. Returns null when no
 * doc exists, which happens for orders created outside this app.
 */
export async function findPaymentRefForOrder(orderId: string): Promise<DocumentReference | null> {
    const snap = await adminDb
        .collection('payments')
        .where('razorpayOrderId', '==', orderId)
        .limit(1)
        .get();
    return snap.empty ? null : snap.docs[0].ref;
}
