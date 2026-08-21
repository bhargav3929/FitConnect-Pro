import { describe, it, expect, vi } from 'vitest';

// getChargeBreakdown lives in a module that pulls in firebase-admin at import
// time; the breakdown itself needs none of it.
vi.mock('@/lib/firebase/admin', () => ({ adminDb: {} }));

import { getChargeBreakdown, type SyncedPlanEntry } from '@/lib/razorpay/pricing';
import { PLAN_CATALOG, getPlanById } from '@fitconnect/shared/types/subscription';

const kickstarter = getPlanById('kickstarter')!;
const twiceQuarterly = getPlanById('twice_quarterly')!;

function synced(overrides: Partial<SyncedPlanEntry> = {}): SyncedPlanEntry {
    return {
        planId: 'twice_quarterly',
        name: '2x Weekly · Quarterly',
        price: 40800,
        foundingPrice: 34680,
        razorpayPlanId: 'plan_x',
        foundingRazorpayPlanId: 'plan_f',
        razorpayItemId: null,
        configured: true,
        foundingConfigured: true,
        category: 'membership',
        source: 'plans',
        ...overrides,
    };
}

describe('getChargeBreakdown - class packs', () => {
    it('adds GST on top of the catalog price', () => {
        const r = getChargeBreakdown(kickstarter, null, false);
        expect(r).toEqual({ basePaise: 500000, gstPaise: 25000, totalPaise: 525000 });
    });

    it('adds GST on top of a synced item price', () => {
        const r = getChargeBreakdown(kickstarter, synced({
            planId: 'kickstarter', category: 'class_pack', price: 6000, foundingPrice: null, source: 'items',
        }), false);
        expect(r.basePaise).toBe(600000);
        expect(r.totalPaise).toBe(630000);
    });
});

describe('getChargeBreakdown - memberships', () => {
    it('uses the Razorpay plan amount as the total, splitting via the plan notes', () => {
        const r = getChargeBreakdown(twiceQuarterly, synced({
            amountPaise: 4284000,
            basePaise: 4080000,
        }), false);
        expect(r).toEqual({ basePaise: 4080000, gstPaise: 204000, totalPaise: 4284000 });
    });

    it('reports no GST for a pre-GST plan rather than inventing one', () => {
        // The old plan charges 40,800 flat. Claiming GST here would overstate the
        // charge on the pricing page relative to what Razorpay actually bills.
        const r = getChargeBreakdown(twiceQuarterly, synced({ amountPaise: 4080000, basePaise: null }), false);
        expect(r).toEqual({ basePaise: 4080000, gstPaise: 0, totalPaise: 4080000 });
    });

    it('uses the founding plan amount for founding members', () => {
        const r = getChargeBreakdown(twiceQuarterly, synced({
            amountPaise: 4284000,
            basePaise: 4080000,
            foundingAmountPaise: 4092240,
            foundingBasePaise: 3468000,
        }), true);
        expect(r).toEqual({ basePaise: 3468000, gstPaise: 624240, totalPaise: 4092240 });
    });

    it('falls back to catalog price plus GST when no Razorpay plan is synced', () => {
        const r = getChargeBreakdown(twiceQuarterly, null, false);
        expect(r).toEqual({ basePaise: 4080000, gstPaise: 204000, totalPaise: 4284000 });
    });

    it('ignores a nonsensical noted base that exceeds the charged total', () => {
        const r = getChargeBreakdown(twiceQuarterly, synced({ amountPaise: 4080000, basePaise: 9999999 }), false);
        expect(r.totalPaise).toBe(4080000);
        expect(r.gstPaise).toBe(0);
    });

    it('never reports a total that differs from base plus gst', () => {
        for (const plan of PLAN_CATALOG) {
            for (const founding of [false, true]) {
                const r = getChargeBreakdown(plan, null, founding);
                expect(r.totalPaise).toBe(r.basePaise + r.gstPaise);
            }
        }
    });
});
