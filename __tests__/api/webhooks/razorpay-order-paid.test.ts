import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as crypto from 'crypto';

const { mockFindPaymentRefForOrder, mockGrantOrderAccess, mockDocSet, mockEventGet } = vi.hoisted(() => ({
    mockFindPaymentRefForOrder: vi.fn(),
    mockGrantOrderAccess: vi.fn(),
    mockDocSet: vi.fn(),
    mockEventGet: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
    adminAuth: { verifyIdToken: vi.fn() },
    adminDb: {
        collection: vi.fn(() => ({
            where: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ({ get: vi.fn() })) })), limit: vi.fn(() => ({ get: vi.fn() })) })),
            doc: vi.fn(() => ({ id: 'evt_doc', get: mockEventGet, set: mockDocSet, update: vi.fn() })),
            add: vi.fn(),
        })),
        // The dedupe transaction is the only one this route runs before dispatching.
        runTransaction: vi.fn(async (fn: (t: unknown) => unknown) =>
            fn({ get: mockEventGet, set: vi.fn(), update: vi.fn() })),
    },
}));

vi.mock('firebase-admin/firestore', () => ({
    FieldValue: { serverTimestamp: vi.fn().mockReturnValue('SERVER_TS') },
}));

vi.mock('@/lib/razorpay/pricing', () => ({
    getPlanIdForRazorpayPlanId: vi.fn(),
    getPricingVariantForRazorpayPlanId: vi.fn(),
}));

vi.mock('@/lib/payments/order-access', () => ({
    findPaymentRefForOrder: mockFindPaymentRefForOrder,
    grantOrderAccess: mockGrantOrderAccess,
}));

const WEBHOOK_SECRET = 'test_webhook_secret';

function makeRequest(body: unknown): NextRequest {
    const raw = JSON.stringify(body);
    const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
    return new NextRequest('http://localhost/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sig },
        body: raw,
    });
}

function capturedOrderEvent(overrides: Record<string, unknown> = {}, id = 'evt_1') {
    return {
        id,
        event: 'order.paid',
        payload: {
            order: { entity: { id: 'order_TQuvPlBvyopQVi', status: 'paid', amount: 500000 } },
            payment: {
                entity: {
                    id: 'pay_TQuvuc4SdJL8JC',
                    order_id: 'order_TQuvPlBvyopQVi',
                    status: 'captured',
                    amount: 500000,
                    email: 'moonisamahnoor@gmail.com',
                    contact: '+917993394026',
                    ...overrides,
                },
            },
        },
    };
}

describe('POST /api/webhooks/razorpay - order.paid', () => {
    const paymentRef = { id: 'E4LfgKrOHsSPI4BhEM9x', set: mockDocSet };

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
        mockEventGet.mockResolvedValue({ exists: false });
        mockFindPaymentRefForOrder.mockResolvedValue(paymentRef);
        mockGrantOrderAccess.mockResolvedValue({
            status: 'granted',
            planId: 'kickstarter',
            planName: 'Sol Intro Program',
            credits: 4,
            endDate: '2026-10-01T00:00:00.000Z',
        });
    });

    it('grants access for a captured one-time order', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const res = await POST(makeRequest(capturedOrderEvent()));

        expect(res.status).toBe(200);
        expect(mockFindPaymentRefForOrder).toHaveBeenCalledWith('order_TQuvPlBvyopQVi');
        expect(mockGrantOrderAccess).toHaveBeenCalledWith(expect.objectContaining({
            paymentRef,
            razorpayPaymentId: 'pay_TQuvuc4SdJL8JC',
            razorpayOrderId: 'order_TQuvPlBvyopQVi',
            source: 'order.paid',
        }));
    });

    it('passes the payer contact details through for the intro lead record', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        await POST(makeRequest(capturedOrderEvent({}, 'evt_contact')));

        expect(mockGrantOrderAccess).toHaveBeenCalledWith(expect.objectContaining({
            identity: { email: 'moonisamahnoor@gmail.com', phone: '+917993394026' },
        }));
    });

    it('ignores subscription payments, which the subscription handlers own', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const event = capturedOrderEvent({ subscription_id: 'sub_abc' }, 'evt_sub');

        const res = await POST(makeRequest(event));

        expect(res.status).toBe(200);
        expect(mockGrantOrderAccess).not.toHaveBeenCalled();
    });

    it('ignores payments that are not captured', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const event = capturedOrderEvent({ status: 'authorized' }, 'evt_auth');

        await POST(makeRequest(event));

        expect(mockGrantOrderAccess).not.toHaveBeenCalled();
    });

    it('flags the payment for review when the grant conflicts', async () => {
        mockGrantOrderAccess.mockResolvedValue({
            status: 'conflict',
            code: 'subscription-already-active',
            message: 'You already have an active membership.',
        });
        const { POST } = await import('@/app/api/webhooks/razorpay/route');

        const res = await POST(makeRequest(capturedOrderEvent({}, 'evt_conflict')));

        expect(res.status).toBe(200);
        expect(mockDocSet).toHaveBeenCalledWith(
            expect.objectContaining({
                needsReview: true,
                reviewReason: 'subscription-already-active: You already have an active membership.',
                razorpayPaymentId: 'pay_TQuvuc4SdJL8JC',
            }),
            { merge: true },
        );
    });

    it('does nothing when no payment doc backs the order', async () => {
        mockFindPaymentRefForOrder.mockResolvedValue(null);
        const { POST } = await import('@/app/api/webhooks/razorpay/route');

        const res = await POST(makeRequest(capturedOrderEvent({}, 'evt_nodoc')));

        expect(res.status).toBe(200);
        expect(mockGrantOrderAccess).not.toHaveBeenCalled();
    });

    it('handles payment.captured the same way as order.paid', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const event = { ...capturedOrderEvent({}, 'evt_captured'), event: 'payment.captured' };

        await POST(makeRequest(event));

        expect(mockGrantOrderAccess).toHaveBeenCalledWith(expect.objectContaining({ source: 'payment.captured' }));
    });
});
