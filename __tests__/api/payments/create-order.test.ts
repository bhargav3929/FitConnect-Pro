import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks (hoisted so vi.mock factories can reference them) ──────────────────

const { mockVerifyIdToken, mockUserGet, mockPaymentSet, mockOrderCreate, mockGetSyncedPlanEntry } = vi.hoisted(() => ({
    mockVerifyIdToken: vi.fn(),
    mockUserGet: vi.fn(),
    mockPaymentSet: vi.fn(),
    mockOrderCreate: vi.fn(),
    mockGetSyncedPlanEntry: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
    adminAuth: { verifyIdToken: mockVerifyIdToken },
    adminDb: {
        collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue({
                get: mockUserGet,
                id: 'payment_doc_id',
                set: mockPaymentSet,
            }),
        }),
    },
}));

vi.mock('razorpay', () => ({
    default: vi.fn().mockImplementation(() => ({
        orders: { create: mockOrderCreate },
    })),
}));

vi.mock('@/lib/razorpay/pricing', () => ({
    getSyncedPlanEntry: mockGetSyncedPlanEntry,
    getChargeAmount: (
        plan: { price: number; foundingPrice?: number },
        syncedPlan: { price: number } | null,
        isFoundingMember: boolean,
    ) => {
        const basePrice = syncedPlan?.price ?? plan.price;
        if (!isFoundingMember || !plan.foundingPrice || plan.price <= 0) return basePrice;
        return Math.round(basePrice * (plan.foundingPrice / plan.price));
    },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, token = 'valid_token'): NextRequest {
    return new NextRequest('http://localhost/api/payments/create-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
}

function userDoc(overrides: Record<string, unknown> = {}) {
    return {
        exists: true,
        data: () => ({
            isFoundingMember: false,
            subscription: null,
            ...overrides,
        }),
    };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/payments/create-order', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockVerifyIdToken.mockResolvedValue({ uid: 'user_123' });
        mockUserGet.mockResolvedValue(userDoc());
        mockPaymentSet.mockResolvedValue(undefined);
        mockGetSyncedPlanEntry.mockResolvedValue(null);
        mockOrderCreate.mockResolvedValue({
            id: 'order_razorpay_abc',
            amount: 500000,
            currency: 'INR',
            status: 'created',
        });
        process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
        process.env.RAZORPAY_KEY_SECRET = 'placeholder_secret';
    });

    it('returns 401 when no Authorization header', async () => {
        const { POST } = await import('@/app/api/payments/create-order/route');
        const req = new NextRequest('http://localhost/api/payments/create-order', {
            method: 'POST',
            body: JSON.stringify({ planId: 'kickstarter' }),
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.code).toBe('unauthenticated');
    });

    it('returns 400 for an unknown planId', async () => {
        const { POST } = await import('@/app/api/payments/create-order/route');
        const req = makeRequest({ planId: 'nonexistent_plan' });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.code).toBe('invalid-argument');
    });

    it('returns 400 when planId is missing', async () => {
        const { POST } = await import('@/app/api/payments/create-order/route');
        const req = makeRequest({});
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('creates Razorpay order and returns orderId + key for valid request', async () => {
        const { POST } = await import('@/app/api/payments/create-order/route');
        const req = makeRequest({ planId: 'kickstarter' });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.orderId).toBe('order_razorpay_abc');
        expect(body.amount).toBe(500000);
        expect(body.currency).toBe('INR');
        expect(body.key).toBe('rzp_test_placeholder');
    });

    it('uses founding member price when eligible', async () => {
        mockUserGet.mockResolvedValue(userDoc({ isFoundingMember: true }));
        const { POST } = await import('@/app/api/payments/create-order/route');
        const req = makeRequest({ planId: 'twice_quarterly' });
        await POST(req);
        // twice_quarterly foundingPrice = 34680, so paise = 3468000
        expect(mockOrderCreate).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 3468000 }),
        );
    });

    it('uses regular price when not a founding member', async () => {
        const { POST } = await import('@/app/api/payments/create-order/route');
        const req = makeRequest({ planId: 'twice_quarterly' });
        await POST(req);
        // twice_quarterly price = 40800, so paise = 4080000
        expect(mockOrderCreate).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 4080000 }),
        );
    });

    it('returns 409 when user already has an active membership', async () => {
        const futureDate = new Date(Date.now() + 30 * 86400 * 1000);
        mockUserGet.mockResolvedValue(
            userDoc({
                subscription: {
                    status: 'active',
                    planCategory: 'membership',
                    endDate: futureDate,
                },
            }),
        );
        const { POST } = await import('@/app/api/payments/create-order/route');
        const req = makeRequest({ planId: 'twice_quarterly' });
        const res = await POST(req);
        expect(res.status).toBe(409);
    });
});
