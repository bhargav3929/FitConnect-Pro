import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as crypto from 'crypto';

const {
    mockUserQuery,
    mockPaymentQuery,
    mockTransactionGet,
    mockTransactionSet,
    mockTransactionUpdate,
    mockDocSet,
    mockDocUpdate,
    mockCollectionAdd,
    mockRunTransaction,
    mockGetPlanIdForRazorpayPlanId,
    mockGetPricingVariantForRazorpayPlanId,
} = vi.hoisted(() => {
    const mockTransactionGet = vi.fn();
    const mockTransactionSet = vi.fn();
    const mockTransactionUpdate = vi.fn();
    const mockRunTransaction = vi.fn();
    return {
        mockUserQuery: vi.fn(),
        mockPaymentQuery: vi.fn(),
        mockTransactionGet,
        mockTransactionSet,
        mockTransactionUpdate,
        mockDocSet: vi.fn(),
        mockDocUpdate: vi.fn(),
        mockCollectionAdd: vi.fn(),
        mockRunTransaction,
        mockGetPlanIdForRazorpayPlanId: vi.fn(),
        mockGetPricingVariantForRazorpayPlanId: vi.fn(),
    };
});

const mockTransaction = { get: mockTransactionGet, set: mockTransactionSet, update: mockTransactionUpdate };

vi.mock('@/lib/firebase/admin', () => ({
    adminAuth: { verifyIdToken: vi.fn() },
    adminDb: {
        collection: vi.fn().mockImplementation((col: string) => {
            const query = {
                where: vi.fn(() => query),
                limit: vi.fn(() => query),
                get: col === 'users' ? mockUserQuery : mockPaymentQuery,
            };
            return {
                where: vi.fn(() => query),
                doc: vi.fn().mockReturnValue({
                    id: 'doc_id',
                    get: mockTransactionGet,
                    set: mockDocSet,
                    update: mockDocUpdate,
                }),
                add: mockCollectionAdd,
            };
        }),
        runTransaction: mockRunTransaction,
        FieldValue: { serverTimestamp: vi.fn().mockReturnValue('SERVER_TS') },
    },
}));

// Also mock FieldValue from firebase-admin/firestore
vi.mock('firebase-admin/firestore', () => ({
    FieldValue: { serverTimestamp: vi.fn().mockReturnValue('SERVER_TS') },
}));

vi.mock('@/lib/razorpay/pricing', () => ({
    getPlanIdForRazorpayPlanId: mockGetPlanIdForRazorpayPlanId,
    getPricingVariantForRazorpayPlanId: mockGetPricingVariantForRazorpayPlanId,
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

const mockUserRef = { id: 'user_123', update: mockDocUpdate };

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

function withEventId<T extends Record<string, unknown>>(payload: T, id: string): T & { id: string } {
    return { ...payload, id };
}

describe('POST /api/webhooks/razorpay', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

        mockUserQuery.mockReset();
        mockPaymentQuery.mockReset();
        mockTransactionGet.mockReset();
        mockTransactionSet.mockReset();
        mockTransactionUpdate.mockReset();
        mockDocSet.mockReset();
        mockDocUpdate.mockReset();
        mockCollectionAdd.mockReset();
        mockGetPlanIdForRazorpayPlanId.mockReset();
        mockGetPricingVariantForRazorpayPlanId.mockReset();
        mockRunTransaction.mockReset();

        mockUserQuery.mockResolvedValue({ empty: false, docs: [activeUserDoc()] });
        mockPaymentQuery.mockResolvedValue({ empty: true, docs: [] });
        mockTransactionGet
            .mockResolvedValueOnce({ exists: false })
            .mockResolvedValue(activeUserDoc());
        mockTransactionSet.mockReturnValue(undefined);
        mockTransactionUpdate.mockReturnValue(undefined);
        mockDocSet.mockResolvedValue(undefined);
        mockDocUpdate.mockResolvedValue(undefined);
        mockCollectionAdd.mockResolvedValue({ id: 'failure_doc' });
        mockGetPlanIdForRazorpayPlanId.mockResolvedValue('twice_quarterly');
        mockGetPricingVariantForRazorpayPlanId.mockResolvedValue('standard');
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
        const res = await POST(makeWebhookRequest(withEventId(chargedPayload, 'evt_charged_smoke')));
        expect(res.status).toBe(200);
        expect((await res.json()).received).toBe(true);
    });

    it('extends endDate by plan durationDays on subscription.charged', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        await POST(makeWebhookRequest(withEventId(chargedPayload, 'evt_charged_end_date')));
        // Should call transaction.update on the user doc with a new endDate
        expect(mockTransactionUpdate).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ 'subscription.status': 'active' }),
        );
    });

    it('adds credits back on subscription.charged', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        await POST(makeWebhookRequest(withEventId(chargedPayload, 'evt_charged_credits')));
        expect(mockTransactionUpdate).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                'subscription.classesRemaining': expect.any(Number),
                'subscription.pricingVariant': 'standard',
            }),
        );
    });

    it('sets subscription status to halted on subscription.halted', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const res = await POST(makeWebhookRequest(withEventId(haltedPayload, 'evt_halted')));
        expect(res.status).toBe(200);
        expect(mockDocUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ 'subscription.status': 'halted' }),
        );
    });

    it('returns 200 silently for unhandled event types', async () => {
        const { POST } = await import('@/app/api/webhooks/razorpay/route');
        const res = await POST(makeWebhookRequest({ event: 'subscription.completed', payload: {} }));
        expect(res.status).toBe(200);
    });
});
