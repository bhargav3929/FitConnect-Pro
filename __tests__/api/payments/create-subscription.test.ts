import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PLAN_CATALOG } from '@fitconnect/shared/types/subscription';

const { mockVerifyIdToken, mockUserGet, mockPaymentSet, mockSubCreate, mockGetSyncedPlanEntry } = vi.hoisted(() => ({
    mockVerifyIdToken: vi.fn(),
    mockUserGet: vi.fn(),
    mockPaymentSet: vi.fn(),
    mockSubCreate: vi.fn(),
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
        subscriptions: { create: mockSubCreate },
    })),
}));

vi.mock('@/lib/razorpay/pricing', () => ({
    getSyncedPlanEntry: mockGetSyncedPlanEntry,
    getChargeAmount: (
        plan: { price: number; foundingPrice?: number },
        syncedPlan: { price: number; foundingPrice?: number | null } | null,
        isFoundingMember: boolean,
    ) => {
        const basePrice = syncedPlan?.price ?? plan.price;
        if (!isFoundingMember || !plan.foundingPrice || plan.price <= 0) return basePrice;
        if (syncedPlan?.foundingPrice) return syncedPlan.foundingPrice;
        return Math.round(basePrice * (plan.foundingPrice / plan.price));
    },
}));

function makeRequest(body: unknown, token = 'valid_token'): NextRequest {
    return new NextRequest('http://localhost/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
}

function userDoc(overrides: Record<string, unknown> = {}) {
    return { exists: true, data: () => ({ isFoundingMember: false, subscription: null, ...overrides }) };
}

function syncedPlan(overrides: Record<string, unknown> = {}) {
    return {
        planId: 'twice_quarterly',
        name: '2x Weekly · Quarterly',
        price: 40800,
        foundingPrice: 34680,
        razorpayPlanId: 'plan_standard_twice_quarterly',
        foundingRazorpayPlanId: 'plan_founding_twice_quarterly',
        razorpayItemId: null,
        configured: true,
        foundingConfigured: true,
        category: 'membership',
        source: 'plans',
        ...overrides,
    };
}

describe('POST /api/payments/create-subscription', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockVerifyIdToken.mockResolvedValue({ uid: 'user_123' });
        mockUserGet.mockResolvedValue(userDoc());
        mockPaymentSet.mockResolvedValue(undefined);
        mockSubCreate.mockResolvedValue({ id: 'sub_test_abc', status: 'created' });
        mockGetSyncedPlanEntry.mockResolvedValue(null);
        process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
        process.env.RAZORPAY_KEY_SECRET = 'placeholder_secret';
    });

    it('returns 401 when no Authorization header', async () => {
        const { POST } = await import('@/app/api/payments/create-subscription/route');
        const req = new NextRequest('http://localhost/api/payments/create-subscription', {
            method: 'POST', body: JSON.stringify({ planId: 'twice_quarterly' }),
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('returns 400 for a class_pack plan (subscriptions are memberships only)', async () => {
        const { POST } = await import('@/app/api/payments/create-subscription/route');
        const res = await POST(makeRequest({ planId: 'kickstarter' }));
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.code).toBe('invalid-argument');
    });

    it('returns 400 for an unknown planId', async () => {
        const { POST } = await import('@/app/api/payments/create-subscription/route');
        const res = await POST(makeRequest({ planId: 'nonexistent' }));
        expect(res.status).toBe(400);
    });

    it('creates Razorpay subscriptions for every configured membership plan', async () => {
        const { POST } = await import('@/app/api/payments/create-subscription/route');

        for (const plan of PLAN_CATALOG.filter((p) => p.category === 'membership')) {
            vi.clearAllMocks();
            mockVerifyIdToken.mockResolvedValue({ uid: 'user_123' });
            mockUserGet.mockResolvedValue(userDoc());
            mockPaymentSet.mockResolvedValue(undefined);
            mockSubCreate.mockResolvedValue({ id: `sub_${plan.id}`, status: 'created' });
            mockGetSyncedPlanEntry.mockResolvedValue(null);

            const res = await POST(makeRequest({ planId: plan.id }));
            expect(res.status, plan.id).toBe(200);
            const body = await res.json();
            expect(body.subscriptionId).toBe(`sub_${plan.id}`);
            expect(body.amount).toBe(plan.price * 100);
            expect(mockSubCreate).toHaveBeenCalledWith(expect.objectContaining({
                plan_id: plan.razorpayPlanId,
                total_count: plan.razorpayTotalCount,
            }));
            expect(mockSubCreate).toHaveBeenCalledWith(
                expect.not.objectContaining({ offer_id: expect.any(String) }),
            );
        }
    });

    it('blocks founding member subscription checkout when the founding Razorpay plan is not configured', async () => {
        mockUserGet.mockResolvedValue(userDoc({ isFoundingMember: true }));
        const plan = PLAN_CATALOG.find((p) => p.id === 'twice_quarterly')!;
        mockGetSyncedPlanEntry.mockResolvedValue(syncedPlan({
            planId: plan.id,
            price: plan.price,
            foundingPrice: plan.foundingPrice,
            razorpayPlanId: plan.razorpayPlanId,
            foundingRazorpayPlanId: null,
            foundingConfigured: false,
        }));
        const { POST } = await import('@/app/api/payments/create-subscription/route');

        const res = await POST(makeRequest({ planId: plan.id }));

        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.code).toBe('founding-plan-not-configured');
        expect(mockSubCreate).not.toHaveBeenCalled();
        expect(mockPaymentSet).not.toHaveBeenCalled();
    });

    it('uses the Razorpay founding plan and returns the founding price for eligible members', async () => {
        mockUserGet.mockResolvedValue(userDoc({ isFoundingMember: true }));
        const plan = PLAN_CATALOG.find((p) => p.id === 'twice_quarterly')!;
        mockGetSyncedPlanEntry.mockResolvedValue(syncedPlan({
            planId: plan.id,
            price: plan.price,
            foundingPrice: plan.foundingPrice,
            razorpayPlanId: 'plan_standard_twice_quarterly',
            foundingRazorpayPlanId: 'plan_founding_twice_quarterly',
        }));
        const { POST } = await import('@/app/api/payments/create-subscription/route');

        const res = await POST(makeRequest({ planId: plan.id }));

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.amount).toBe(plan.foundingPrice! * 100);
        expect(mockSubCreate).toHaveBeenCalledWith(expect.objectContaining({
            plan_id: 'plan_founding_twice_quarterly',
            notes: expect.objectContaining({
                planId: plan.id,
                userId: 'user_123',
                pricingVariant: 'founding',
            }),
        }));
        expect(mockSubCreate).toHaveBeenCalledWith(
            expect.not.objectContaining({ offer_id: expect.any(String) }),
        );
        expect(mockPaymentSet).toHaveBeenCalledWith(expect.objectContaining({
            amount: plan.foundingPrice,
            metadata: expect.objectContaining({
                listPrice: plan.price,
                chargeAmount: plan.foundingPrice,
                foundingMemberDiscountApplied: true,
                razorpayPlanId: 'plan_founding_twice_quarterly',
                standardRazorpayPlanId: 'plan_standard_twice_quarterly',
                foundingRazorpayPlanId: 'plan_founding_twice_quarterly',
                pricingVariant: 'founding',
            }),
        }));
    });

    it('returns 409 when user already has an active membership', async () => {
        const futureDate = new Date(Date.now() + 30 * 86400 * 1000);
        mockUserGet.mockResolvedValue(userDoc({
            subscription: { status: 'active', planCategory: 'membership', endDate: futureDate },
        }));
        const { POST } = await import('@/app/api/payments/create-subscription/route');
        const res = await POST(makeRequest({ planId: 'twice_quarterly' }));
        expect(res.status).toBe(409);
    });
});
