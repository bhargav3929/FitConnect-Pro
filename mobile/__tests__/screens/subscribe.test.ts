import { describe, it, expect, vi } from 'vitest';

// Mock Firebase modules before any shared imports
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
    getApps: vi.fn(() => []),
    getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({ currentUser: null })),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    getDocs: vi.fn(),
    Timestamp: { fromDate: vi.fn() },
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({})),
}));

vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(() => ({})),
}));

describe('Subscribe screen — plan catalog integration', () => {
    it('PLAN_CATALOG has 6 plans', async () => {
        const { PLAN_CATALOG } = await import(
            '@fitconnect/shared/types/subscription'
        );
        expect(PLAN_CATALOG).toHaveLength(6);
    });

    it('has both memberships and class packs', async () => {
        const { PLAN_CATALOG } = await import(
            '@fitconnect/shared/types/subscription'
        );
        const memberships = PLAN_CATALOG.filter((p) => p.category === 'membership');
        const classPacks = PLAN_CATALOG.filter((p) => p.category === 'class_pack');

        expect(memberships.length).toBe(4);
        expect(classPacks.length).toBe(2);
    });

    it('getPlanById returns the correct plan', async () => {
        const { getPlanById } = await import(
            '@fitconnect/shared/types/subscription'
        );

        const twice = getPlanById('twice_quarterly');
        expect(twice).toBeDefined();
        expect(twice!.name).toBe('2x Weekly · Quarterly');
        expect(twice!.price).toBe(36000);
        expect(twice!.credits).toBe(24);
        expect(twice!.category).toBe('membership');
    });

    it('getPlanById returns undefined for invalid id', async () => {
        const { getPlanById } = await import(
            '@fitconnect/shared/types/subscription'
        );
        expect(getPlanById('nonexistent')).toBeUndefined();
    });

    it('all plans have required fields', async () => {
        const { PLAN_CATALOG } = await import(
            '@fitconnect/shared/types/subscription'
        );

        for (const plan of PLAN_CATALOG) {
            expect(plan.id).toBeDefined();
            expect(plan.name).toBeDefined();
            expect(plan.category).toBeDefined();
            expect(typeof plan.price).toBe('number');
            expect(plan.price).toBeGreaterThanOrEqual(0);
            expect(typeof plan.durationDays).toBe('number');
            expect(plan.durationDays).toBeGreaterThan(0);
            expect(Array.isArray(plan.features)).toBe(true);
            expect(plan.features.length).toBeGreaterThan(0);
        }
    });

    it('drop-in plan has 1 credit', async () => {
        const { getPlanById } = await import(
            '@fitconnect/shared/types/subscription'
        );
        const dropIn = getPlanById('drop_in');
        expect(dropIn).toBeDefined();
        expect(dropIn!.credits).toBe(1);
        expect(dropIn!.price).toBe(1000);
    });

    it('ten_pack plan has correct values', async () => {
        const { getPlanById } = await import(
            '@fitconnect/shared/types/subscription'
        );
        const twice6mo = getPlanById('twice_6mo');
        expect(twice6mo).toBeDefined();
        expect(twice6mo!.credits).toBe(48);
        expect(twice6mo!.price).toBe(64000);
        expect(twice6mo!.guestPasses).toBe(1);
        expect(twice6mo!.durationDays).toBe(180);
    });

    it('only one plan is marked as recommended', async () => {
        const { PLAN_CATALOG } = await import(
            '@fitconnect/shared/types/subscription'
        );
        const recommended = PLAN_CATALOG.filter((p) => p.recommended);
        expect(recommended).toHaveLength(1);
        expect(recommended[0].id).toBe('thrice_quarterly');
    });

    it('membership plans auto-renew, class packs do not', async () => {
        const { PLAN_CATALOG } = await import(
            '@fitconnect/shared/types/subscription'
        );

        for (const plan of PLAN_CATALOG) {
            if (plan.category === 'membership') {
                expect(plan.autoRenew).toBe(true);
            } else {
                expect(plan.autoRenew).toBe(false);
            }
        }
    });
});
