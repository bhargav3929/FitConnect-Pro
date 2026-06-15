import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PLAN_CATALOG } from '@fitconnect/shared/types/subscription';

const {
    mockVerifyIdToken,
    mockUserGet,
    mockCollection,
    mockBatch,
    mockUpdateRazorpaySubscription,
    mockGetSyncedPlanEntry,
} = vi.hoisted(() => {
    const batch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
    };
    return {
        mockVerifyIdToken: vi.fn(),
        mockUserGet: vi.fn(),
        mockCollection: vi.fn(),
        mockBatch: batch,
        mockUpdateRazorpaySubscription: vi.fn(),
        mockGetSyncedPlanEntry: vi.fn(),
    };
});

vi.mock('@/lib/firebase/admin', () => ({
    adminAuth: { verifyIdToken: mockVerifyIdToken },
    adminDb: {
        collection: mockCollection,
        batch: vi.fn(() => mockBatch),
    },
}));

vi.mock('@fitconnect/shared/payments/razorpay-processor', () => ({
    updateRazorpaySubscription: mockUpdateRazorpaySubscription,
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
        return syncedPlan?.foundingPrice ?? Math.round(basePrice * (plan.foundingPrice / plan.price));
    },
}));

function makeRequest(body: unknown, token = 'valid_token'): NextRequest {
    return new NextRequest('http://localhost/api/subscriptions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
}

function activeMembership(overrides: Record<string, unknown> = {}) {
    return {
        status: 'active',
        planId: 'twice_quarterly',
        planCategory: 'membership',
        razorpaySubscriptionId: 'sub_existing_123',
        classesRemaining: 12,
        introCreditRemaining: 0,
        cancelAtPeriodEnd: false,
        ...overrides,
    };
}

function userDoc(overrides: Record<string, unknown> = {}) {
    return {
        exists: true,
        data: () => ({
            isFoundingMember: false,
            subscription: activeMembership(),
            ...overrides,
        }),
    };
}

function syncedPlan(planId: string, overrides: Record<string, unknown> = {}) {
    const plan = PLAN_CATALOG.find((entry) => entry.id === planId)!;
    return {
        planId,
        name: plan.name,
        price: plan.price,
        foundingPrice: plan.foundingPrice ?? null,
        razorpayPlanId: `plan_standard_${planId}`,
        foundingRazorpayPlanId: plan.foundingPrice ? `plan_founding_${planId}` : null,
        razorpayItemId: null,
        configured: true,
        foundingConfigured: !!plan.foundingPrice,
        category: plan.category,
        source: 'plans',
        ...overrides,
    };
}

describe('POST /api/subscriptions/update', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockVerifyIdToken.mockResolvedValue({ uid: 'user_123' });
        mockUserGet.mockResolvedValue(userDoc());
        mockCollection.mockImplementation((name: string) => ({
            doc: vi.fn(() => (
                name === 'users'
                    ? { get: mockUserGet }
                    : { id: 'change_doc_id' }
            )),
        }));
        mockBatch.commit.mockResolvedValue(undefined);
        mockUpdateRazorpaySubscription.mockResolvedValue({
            status: 'active',
            current_start: 1_800_000_000,
            current_end: 1_807_776_000,
            has_scheduled_changes: false,
        });
        mockGetSyncedPlanEntry.mockImplementation(async (planId: string) => syncedPlan(planId));
        process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
        process.env.RAZORPAY_KEY_SECRET = 'placeholder_secret';
    });

    it('uses the target founding Razorpay plan when a founding member changes membership', async () => {
        mockUserGet.mockResolvedValue(userDoc({
            isFoundingMember: true,
            subscription: activeMembership({ planId: 'twice_quarterly' }),
        }));
        const { POST } = await import('@/app/api/subscriptions/update/route');

        const res = await POST(makeRequest({ planId: 'thrice_quarterly' }));

        expect(res.status).toBe(200);
        expect(mockUpdateRazorpaySubscription).toHaveBeenCalledWith(
            'sub_existing_123',
            'plan_founding_thrice_quarterly',
            'rzp_test_placeholder',
            'placeholder_secret',
            expect.objectContaining({ scheduleChangeAt: 'now' }),
        );
        expect(mockBatch.set).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'change_doc_id' }),
            expect.objectContaining({
                razorpayPlanId: 'plan_founding_thrice_quarterly',
                standardRazorpayPlanId: 'plan_standard_thrice_quarterly',
                foundingRazorpayPlanId: 'plan_founding_thrice_quarterly',
                foundingMemberDiscountApplied: true,
                pricingVariant: 'founding',
            }),
        );
        expect(mockBatch.update).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                'subscription.razorpayPlanId': 'plan_founding_thrice_quarterly',
                'subscription.pricingVariant': 'founding',
            }),
        );
    });

    it('fails closed when the target founding Razorpay plan is missing', async () => {
        mockUserGet.mockResolvedValue(userDoc({ isFoundingMember: true }));
        mockGetSyncedPlanEntry.mockImplementation(async (planId: string) => syncedPlan(planId, {
            foundingRazorpayPlanId: null,
            foundingConfigured: false,
        }));
        const { POST } = await import('@/app/api/subscriptions/update/route');

        const res = await POST(makeRequest({ planId: 'thrice_quarterly' }));

        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.code).toBe('founding-plan-not-configured');
        expect(mockUpdateRazorpaySubscription).not.toHaveBeenCalled();
        expect(mockBatch.commit).not.toHaveBeenCalled();
    });
});
