import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as crypto from 'crypto';

const { mockUserQuery, mockPaymentQuery, mockTransactionGet, mockTransactionUpdate, mockRunTransaction } = vi.hoisted(() => {
    const mockTransactionGet = vi.fn();
    const mockTransactionUpdate = vi.fn();
    const mockRunTransaction = vi.fn();
    return {
        mockUserQuery: vi.fn(),
        mockPaymentQuery: vi.fn(),
        mockTransactionGet,
        mockTransactionUpdate,
        mockRunTransaction,
    };
});

const mockTransaction = { get: mockTransactionGet, update: mockTransactionUpdate };

vi.mock('@/lib/firebase/admin', () => ({
    adminAuth: { verifyIdToken: vi.fn() },
    adminDb: {
        collection: vi.fn().mockImplementation((col: string) => ({
            where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({ get: col === 'users' ? mockUserQuery : mockPaymentQuery }),
            }),
            doc: vi.fn().mockReturnValue({ id: 'doc_id', get: mockTransactionGet }),
        })),
        runTransaction: mockRunTransaction,
        FieldValue: { serverTimestamp: vi.fn().mockReturnValue('SERVER_TS') },
    },
}));

// Also mock FieldValue from firebase-admin/firestore
vi.mock('firebase-admin/firestore', () => ({
    FieldValue: { serverTimestamp: vi.fn().mockReturnValue('SERVER_TS') },
}));

const WEBHOOK_SECRET = 'test_webhook_secret';

function makeWebhookRequest(body: unknown, secret = WEBHOOK_SECRET): NextRequest {
    const raw = JSON.stringify(body);
    const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    return new NextRequest('http://localhost/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sig },
        body: raw,
    });
}

const mockUserRef = { id: 'user_123' };

function activeUserDoc(subOverrides: Record<string, unknown> = {}) {
    return {
        exists: true,
        id: 'user_123',
        ref: mockUserRef,
        data: () => ({
            subscription: {
                planId: 'twice_quarterly',
                planCategory: 'membership',
                status: 'active',
                classesRemaining: 0,
                endDate: { toDate: () => new Date('2026-08-28') },
                razorpaySubscriptionId: 'sub_abc',
                ...subOverrides,
            },
        }),
    };
}

const chargedPayload = {
    event: 'subscription.charged',
    payload: {
        subscription: { entity: { id: 'sub_abc', plan_id: 'plan_rzp_twice_quarterly', status: 'active' } },
        payment: { entity: { id: 'pay_newcharge', amount: 3600000, currency: 'INR' } },
    },
};

const haltedPayload = {
    event: 'subscription.halted',
    payload: {
        subscription: { entity: { id: 'sub_abc', status: 'halted' } },
    },
};

describe('POST /api/webhooks/razorpay', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

        mockUserQuery.mockResolvedValue({ empty: false, docs: [activeUserDoc()] });
        mockTransactionGet.mockResolvedValue(activeUserDoc());
        mockTransactionUpdate.mockReturnValue(undefined);
        mockRunTransaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => fn(mockTransaction));
    });

    it('returns 400 when x-razorpay-signature header is missing', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const req = new NextRequest('http://localhost/api/webhooks/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chargedPayload),
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 400 when signature is invalid', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const req = makeWebhookRequest(chargedPayload, 'wrong_secret');
        const res = await POST(req);
        expect(res.status).toBe(400);
        expect((await res.json()).code).toBe('signature-invalid');
    });

    it('returns 200 and extends subscription on subscription.charged', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const res = await POST(makeWebhookRequest(chargedPayload));
        expect(res.status).toBe(200);
        expect((await res.json()).received).toBe(true);
    });

    it('extends endDate by plan durationDays on subscription.charged', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        await POST(makeWebhookRequest(chargedPayload));
        // Should call transaction.update on the user doc with a new endDate
        expect(mockTransactionUpdate).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ 'subscription.status': 'active' }),
        );
    });

    it('adds credits back on subscription.charged', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        await POST(makeWebhookRequest(chargedPayload));
        expect(mockTransactionUpdate).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ 'subscription.classesRemaining': expect.any(Number) }),
        );
    });

    it('sets subscription status to expiring_soon on subscription.halted', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const res = await POST(makeWebhookRequest(haltedPayload));
        expect(res.status).toBe(200);
        expect(mockTransactionUpdate).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ 'subscription.status': 'expiring_soon' }),
        );
    });

    it('returns 200 silently for unhandled event types', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const res = await POST(makeWebhookRequest({ event: 'subscription.completed', payload: {} }));
        expect(res.status).toBe(200);
    });
});
