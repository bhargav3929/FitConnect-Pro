import { describe, it, expect } from 'vitest';
import {
    PLAN_CATALOG,
    getPlanById,
    VALID_PLAN_IDS,
    LEGACY_PLAN_MAP,
} from '../../src/types/subscription';

describe('PLAN_CATALOG', () => {
    it('contains exactly 9 plans', () => {
        expect(PLAN_CATALOG).toHaveLength(9);
    });

    it('every plan has required fields', () => {
        for (const plan of PLAN_CATALOG) {
            expect(plan.id).toBeTruthy();
            expect(plan.name).toBeTruthy();
            expect(['membership', 'class_pack']).toContain(plan.category);
            expect(plan.price).toBeGreaterThanOrEqual(0);
            expect(plan.durationDays).toBeGreaterThan(0);
            expect(plan.maxClassesPerDay).toBeGreaterThanOrEqual(1);
            expect(plan.weeklyClassLimit).toBeGreaterThanOrEqual(1);
            expect(plan.advanceBookingDays).toBeGreaterThanOrEqual(0);
            expect(plan.guestPasses).toBeGreaterThanOrEqual(0);
            expect(typeof plan.autoRenew).toBe('boolean');
            expect(plan.features.length).toBeGreaterThan(0);
        }
    });

    it('has exactly one recommended plan', () => {
        const recommended = PLAN_CATALOG.filter((p) => p.recommended);
        expect(recommended).toHaveLength(1);
        expect(recommended[0].id).toBe('thrice_quarterly');
    });

    it('all plan IDs are unique', () => {
        const ids = PLAN_CATALOG.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('drop_in has demo session pricing', () => {
        expect(getPlanById('drop_in')?.price).toBe(1000);
        expect(getPlanById('drop_in')?.weeklyClassLimit).toBe(1);
    });

    it('kickstarter requires consultation', () => {
        expect(getPlanById('kickstarter')?.requiresConsultation).toBe(true);
        expect(getPlanById('kickstarter')?.weeklyClassLimit).toBe(2);
    });

    it('single_session is a one-credit regular class pack', () => {
        const plan = getPlanById('single_session');
        expect(plan?.price).toBe(2000);
        expect(plan?.category).toBe('class_pack');
        expect(plan?.credits).toBe(1);
        expect(plan?.weeklyClassLimit).toBe(1);
    });

    it('monthly memberships bill every month with weekly credits', () => {
        const twice = getPlanById('twice_monthly');
        expect(twice?.price).toBe(14400);
        expect(twice?.credits).toBe(8);
        expect(twice?.durationDays).toBe(30);
        expect(twice?.razorpayInterval).toBe(1);
        const thrice = getPlanById('thrice_monthly');
        expect(thrice?.price).toBe(21600);
        expect(thrice?.credits).toBe(12);
        expect(thrice?.durationDays).toBe(30);
        expect(thrice?.razorpayInterval).toBe(1);
    });

    it('enforces expected weekly plan limits', () => {
        expect(getPlanById('twice_monthly')?.weeklyClassLimit).toBe(2);
        expect(getPlanById('thrice_monthly')?.weeklyClassLimit).toBe(3);
        expect(getPlanById('twice_quarterly')?.weeklyClassLimit).toBe(2);
        expect(getPlanById('twice_6mo')?.weeklyClassLimit).toBe(2);
        expect(getPlanById('thrice_quarterly')?.weeklyClassLimit).toBe(3);
        expect(getPlanById('thrice_6mo')?.weeklyClassLimit).toBe(3);
    });
});

describe('getPlanById', () => {
    it('returns correct plan for each valid ID', () => {
        expect(getPlanById('kickstarter')?.price).toBe(5000);
        expect(getPlanById('twice_quarterly')?.credits).toBe(24);
        expect(getPlanById('twice_6mo')?.credits).toBe(48);
        expect(getPlanById('thrice_quarterly')?.credits).toBe(36);
        expect(getPlanById('thrice_6mo')?.credits).toBe(72);
    });

    it('returns undefined for invalid ID', () => {
        expect(getPlanById('nonexistent')).toBeUndefined();
        expect(getPlanById('')).toBeUndefined();
    });

    it('finds all plans listed in VALID_PLAN_IDS', () => {
        for (const planId of VALID_PLAN_IDS) {
            const plan = getPlanById(planId);
            expect(plan).toBeDefined();
            expect(plan!.id).toBe(planId);
        }
    });
});

describe('VALID_PLAN_IDS', () => {
    it('contains all 9 plan IDs', () => {
        expect(VALID_PLAN_IDS).toHaveLength(9);
    });

    it('matches PLAN_CATALOG order', () => {
        const catalogIds = PLAN_CATALOG.map((p) => p.id);
        expect(VALID_PLAN_IDS).toEqual(catalogIds);
    });
});

describe('LEGACY_PLAN_MAP', () => {
    it('maps to valid PlanIds', () => {
        for (const mappedId of Object.values(LEGACY_PLAN_MAP)) {
            expect(VALID_PLAN_IDS).toContain(mappedId);
        }
    });
});
