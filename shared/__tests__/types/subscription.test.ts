import { describe, it, expect } from 'vitest';
import {
    PLAN_CATALOG,
    getPlanById,
    VALID_PLAN_IDS,
    LEGACY_PLAN_MAP,
    type PlanId,
    type PlanDefinition,
    type PlanCategory,
} from '../../src/types/subscription';

describe('PLAN_CATALOG', () => {
    it('contains exactly 6 plans', () => {
        expect(PLAN_CATALOG).toHaveLength(6);
    });

    it('every plan has required fields', () => {
        for (const plan of PLAN_CATALOG) {
            expect(plan.id).toBeTruthy();
            expect(plan.name).toBeTruthy();
            expect(['membership', 'class_pack']).toContain(plan.category);
            expect(plan.price).toBeGreaterThan(0);
            expect(plan.durationDays).toBeGreaterThan(0);
            expect(plan.maxClassesPerDay).toBeGreaterThanOrEqual(1);
            expect(plan.advanceBookingDays).toBeGreaterThanOrEqual(0);
            expect(plan.guestPasses).toBeGreaterThanOrEqual(0);
            expect(typeof plan.autoRenew).toBe('boolean');
            expect(plan.features.length).toBeGreaterThan(0);
        }
    });

    it('has exactly one recommended plan', () => {
        const recommended = PLAN_CATALOG.filter((p) => p.recommended);
        expect(recommended).toHaveLength(1);
        expect(recommended[0].id).toBe('unlimited');
    });

    it('has 3 memberships and 3 class packs', () => {
        const memberships = PLAN_CATALOG.filter((p) => p.category === 'membership');
        const classPacks = PLAN_CATALOG.filter((p) => p.category === 'class_pack');
        expect(memberships).toHaveLength(3);
        expect(classPacks).toHaveLength(3);
    });

    it('all memberships auto-renew', () => {
        const memberships = PLAN_CATALOG.filter((p) => p.category === 'membership');
        for (const m of memberships) {
            expect(m.autoRenew).toBe(true);
        }
    });

    it('no class packs auto-renew', () => {
        const packs = PLAN_CATALOG.filter((p) => p.category === 'class_pack');
        for (const p of packs) {
            expect(p.autoRenew).toBe(false);
        }
    });

    it('unlimited plan has null credits', () => {
        const unlimited = PLAN_CATALOG.find((p) => p.id === 'unlimited');
        expect(unlimited?.credits).toBeNull();
    });

    it('all plan IDs are unique', () => {
        const ids = PLAN_CATALOG.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('getPlanById', () => {
    it('returns correct plan for each valid ID', () => {
        expect(getPlanById('unlimited')?.name).toBe('Unlimited');
        expect(getPlanById('unlimited')?.price).toBe(200);

        expect(getPlanById('twice_weekly')?.name).toBe('Twice Weekly');
        expect(getPlanById('twice_weekly')?.credits).toBe(8);

        expect(getPlanById('once_weekly')?.name).toBe('Once Weekly');
        expect(getPlanById('once_weekly')?.credits).toBe(4);

        expect(getPlanById('drop_in')?.name).toBe('Drop-In');
        expect(getPlanById('drop_in')?.credits).toBe(1);

        expect(getPlanById('five_pack')?.name).toBe('5 Pack');
        expect(getPlanById('five_pack')?.guestPasses).toBe(1);

        expect(getPlanById('ten_pack')?.name).toBe('10 Pack');
        expect(getPlanById('ten_pack')?.guestPasses).toBe(2);
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
    it('contains all 6 plan IDs', () => {
        expect(VALID_PLAN_IDS).toHaveLength(6);
    });

    it('includes expected IDs', () => {
        expect(VALID_PLAN_IDS).toContain('unlimited');
        expect(VALID_PLAN_IDS).toContain('twice_weekly');
        expect(VALID_PLAN_IDS).toContain('once_weekly');
        expect(VALID_PLAN_IDS).toContain('drop_in');
        expect(VALID_PLAN_IDS).toContain('five_pack');
        expect(VALID_PLAN_IDS).toContain('ten_pack');
    });

    it('matches PLAN_CATALOG order', () => {
        const catalogIds = PLAN_CATALOG.map((p) => p.id);
        expect(VALID_PLAN_IDS).toEqual(catalogIds);
    });
});

describe('LEGACY_PLAN_MAP', () => {
    it('maps all three legacy names', () => {
        expect(LEGACY_PLAN_MAP['weekly']).toBe('once_weekly');
        expect(LEGACY_PLAN_MAP['monthly']).toBe('twice_weekly');
        expect(LEGACY_PLAN_MAP['quarterly']).toBe('ten_pack');
    });

    it('maps to valid PlanIds', () => {
        for (const mappedId of Object.values(LEGACY_PLAN_MAP)) {
            expect(VALID_PLAN_IDS).toContain(mappedId);
        }
    });

    it('has exactly 3 entries', () => {
        expect(Object.keys(LEGACY_PLAN_MAP)).toHaveLength(3);
    });
});
