import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as crypto from 'crypto';

const {
    mockVerifyIdToken,
    mockTransactionGet,
    mockTransactionUpdate,
    mockRunTransaction,
} = vi.hoisted(() => {
    const mockTransactionGet = vi.fn();
    const mockTransactionUpdate = vi.fn();
    const mockRunTransaction = vi.fn();
    return { mockVerifyIdToken: vi.fn(), mockTransactionGet, mockTransactionUpdate, mockRunTransaction };
});

const mockTransaction = { get: mockTransactionGet, update: mockTransactionUpdate };

vi.mock('@/lib/firebase/admin', () => ({
    adminAuth: { verifyIdToken: mockVerifyIdToken },
    adminDb: {
        collection: vi.fn().mockImplementation((col: string) => ({
            doc: vi.fn().mockReturnValue(
                col === 'payments'
                    ? { id: 'payment_doc_id', get: mockTransactionGet }
                    : { id: 'user_123', get: mockTransactionGet },
            ),
        })),
        runTransaction: mockRunTransaction,
    },
}));

const KEY_SECRET = 'placeholder_secret';

function makeSignature(subscriptionId: string, paymentId: string): string {
    return crypto.createHmac('sha256', KEY_SECRET).update(`${subscriptionId}|${paymentId}`).digest('hex');
}

function makeRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/payments/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid_token' },
        body: JSON.stringify(body),
    });
}

function paymentDoc(overrides: Record<string, unknown> = {}) {
    return {
        exists: true,
        data: () => ({ userId: 'user_123', status: 'pending', planId: 'twice_quarterly', amount: 36000, razorpaySubscriptionId: 'sub_abc', ...overrides }),
    };
}

function userDoc(overrides: Record<string, unknown> = {}) {
    return { exists: true, data: () => ({ subscription: null, ...overrides }) };
}

describe('POST /api/payments/verify-subscription', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockVerifyIdToken.mockResolvedValue({ uid: 'user_123' });
        process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;

        mockTransactionGet
            .mockResolvedValueOnce(paymentDoc())
            .mockResolvedValueOnce(userDoc());
        mockTransactionUpdate.mockReturnValue(undefined);
        mockRunTransaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => fn(mockTransaction));
    });

    it('returns 401 with no Authorization header', async () => {
        const { POST } = await import('@/app/api/payments/verify-subscription/route');
        const req = new NextRequest('http://localhost/api/payments/verify-subscription', {
            method: 'POST', body: JSON.stringify({}),
        });
        expect((await POST(req)).status).toBe(401);
    });

    it('returns 400 when signature fields are missing', async () => {
        const { POST } = await import('@/app/api/payments/verify-subscription/route');
        const res = await POST(makeRequest({ razorpay_subscription_id: 'sub_abc', razorpay_payment_id: 'pay_xyz' }));
        expect(res.status).toBe(400);
        expect((await res.json()).code).toBe('invalid-argument');
    });

    it('returns 400 for an invalid signature', async () => {
        const { POST } = await import('@/app/api/payments/verify-subscription/route');
        const res = await POST(makeRequest({
            razorpay_subscription_id: 'sub_abc',
            razorpay_payment_id: 'pay_xyz',
            razorpay_signature: 'tampered',
            paymentId: 'payment_doc_id',
        }));
        expect(res.status).toBe(400);
        expect((await res.json()).code).toBe('signature-invalid');
    });

    it('returns 200 and activates subscription when signature is valid', async () => {
        const sig = makeSignature('sub_abc', 'pay_xyz');
        const { POST } = await import('@/app/api/payments/verify-subscription/route');
        const res = await POST(makeRequest({
            razorpay_subscription_id: 'sub_abc',
            razorpay_payment_id: 'pay_xyz',
            razorpay_signature: sig,
            paymentId: 'payment_doc_id',
        }));
        expect(res.status).toBe(200);
        expect((await res.json()).success).toBe(true);
    });

    it('stores razorpaySubscriptionId on the user subscription', async () => {
        const sig = makeSignature('sub_abc', 'pay_xyz');
        const { POST } = await import('@/app/api/payments/verify-subscription/route');
        await POST(makeRequest({
            razorpay_subscription_id: 'sub_abc',
            razorpay_payment_id: 'pay_xyz',
            razorpay_signature: sig,
            paymentId: 'payment_doc_id',
        }));
        expect(mockTransactionUpdate).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ 'subscription.razorpaySubscriptionId': 'sub_abc' }),
        );
    });
});
