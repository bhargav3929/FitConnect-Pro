import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as crypto from 'crypto';

// ── Mocks ────────────────────────────────────────────────────────────────────

const {
    mockVerifyIdToken,
    mockPaymentDocGet,
    mockUserDocGet,
    mockTransaction,
    mockTransactionGet,
    mockTransactionUpdate,
    mockRunTransaction,
} = vi.hoisted(() => {
    const mockTransactionGet = vi.fn();
    const mockTransactionUpdate = vi.fn();
    const mockRunTransaction = vi.fn();
    return {
        mockVerifyIdToken: vi.fn(),
        mockPaymentDocGet: vi.fn(),
        mockUserDocGet: vi.fn(),
        mockTransaction: { get: mockTransactionGet, update: mockTransactionUpdate },
        mockTransactionGet,
        mockTransactionUpdate,
        mockRunTransaction,
    };
});

const mockPaymentDocRef = { id: 'payment_doc_id' };
const mockUserDocRef = { id: 'user_123' };

vi.mock('@/lib/firebase/admin', () => ({
    adminAuth: { verifyIdToken: mockVerifyIdToken },
    adminDb: {
        collection: vi.fn().mockImplementation((col: string) => ({
            doc: vi.fn().mockImplementation(() => {
                if (col === 'payments') return { ...mockPaymentDocRef, get: mockPaymentDocGet };
                return { ...mockUserDocRef, get: mockUserDocGet };
            }),
        })),
        runTransaction: mockRunTransaction,
    },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const KEY_SECRET = 'placeholder_secret';

function makeSignature(orderId: string, paymentId: string): string {
    return crypto
        .createHmac('sha256', KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
}

function makeRequest(body: unknown, token = 'valid_token'): NextRequest {
    return new NextRequest('http://localhost/api/payments/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
}

function paymentDoc(overrides: Record<string, unknown> = {}) {
    return {
        exists: true,
        data: () => ({
            userId: 'user_123',
            status: 'pending',
            planId: 'kickstarter',
            amount: 5000,
            razorpayOrderId: 'order_abc',
            ...overrides,
        }),
    };
}

function activeUserDoc(overrides: Record<string, unknown> = {}) {
    return {
        exists: true,
        data: () => ({
            subscription: null,
            ...overrides,
        }),
    };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/payments/verify', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockVerifyIdToken.mockResolvedValue({ uid: 'user_123' });
        process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;

        mockTransactionGet
            .mockResolvedValueOnce(paymentDoc())
            .mockResolvedValueOnce(activeUserDoc());
        mockTransactionUpdate.mockReturnValue(undefined);
        mockRunTransaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => {
            return fn(mockTransaction);
        });
    });

    it('returns 401 when no Authorization header', async () => {
        const { POST } = await import('@/app/api/payments/verify/route');
        const req = new NextRequest('http://localhost/api/payments/verify', {
            method: 'POST',
            body: JSON.stringify({}),
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('returns 400 when signature is missing', async () => {
        const { POST } = await import('@/app/api/payments/verify/route');
        const req = makeRequest({ razorpay_order_id: 'order_abc', razorpay_payment_id: 'pay_xyz' });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.code).toBe('invalid-argument');
    });

    it('returns 400 when signature is invalid (tampered)', async () => {
        const { POST } = await import('@/app/api/payments/verify/route');
        const req = makeRequest({
            razorpay_order_id: 'order_abc',
            razorpay_payment_id: 'pay_xyz',
            razorpay_signature: 'deadbeef_tampered_signature',
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.code).toBe('signature-invalid');
    });

    it('returns 200 and activates subscription when signature is valid', async () => {
        const orderId = 'order_abc';
        const paymentId = 'pay_xyz';
        const sig = makeSignature(orderId, paymentId);

        const { POST } = await import('@/app/api/payments/verify/route');
        const req = makeRequest({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: sig,
            paymentId: 'payment_doc_id',
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
    });

    it('calls transaction.update twice (payment + user) on success', async () => {
        const orderId = 'order_abc';
        const paymentId = 'pay_xyz';
        const sig = makeSignature(orderId, paymentId);

        const { POST } = await import('@/app/api/payments/verify/route');
        const req = makeRequest({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: sig,
            paymentId: 'payment_doc_id',
        });
        await POST(req);
        expect(mockTransactionUpdate).toHaveBeenCalledTimes(2);
    });

    it('returns 400 when payment is already confirmed', async () => {
        mockTransactionGet.mockReset();
        mockTransactionGet
            .mockResolvedValueOnce(paymentDoc({ status: 'succeeded' }))
            .mockResolvedValueOnce(activeUserDoc());
        mockRunTransaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => fn(mockTransaction));

        const orderId = 'order_abc';
        const paymentId = 'pay_xyz';
        const sig = makeSignature(orderId, paymentId);

        const { POST } = await import('@/app/api/payments/verify/route');
        const req = makeRequest({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: sig,
            paymentId: 'payment_doc_id',
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.code).toBe('failed-precondition');
    });
});
