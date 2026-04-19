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

        expect(memberships.length).toBe(3);
        expect(classPacks.length).toBe(3);
    });

    it('getPlanById returns the correct plan', async () => {
        const { getPlanById } = await import(
            '@fitconnect/shared/types/subscription'
        );

        const unlimited = getPlanById('unlimited');
        expect(unlimited).toBeDefined();
        expect(unlimited!.name).toBe('Unlimited');
        expect(unlimited!.price).toBe(200);
        expect(unlimited!.credits).toBeNull(); // unlimited
        expect(unlimited!.category).toBe('membership');
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
            expect(plan.price).toBeGreaterThan(0);
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
        expect(dropIn!.price).toBe(35);
    });

    it('ten_pack plan has correct values', async () => {
        const { getPlanById } = await import(
            '@fitconnect/shared/types/subscription'
        );
        const tenPack = getPlanById('ten_pack');
        expect(tenPack).toBeDefined();
        expect(tenPack!.credits).toBe(10);
        expect(tenPack!.price).toBe(300);
        expect(tenPack!.guestPasses).toBe(2);
        expect(tenPack!.durationDays).toBe(180);
    });

    it('only one plan is marked as recommended', async () => {
        const { PLAN_CATALOG } = await import(
            '@fitconnect/shared/types/subscription'
        );
        const recommended = PLAN_CATALOG.filter((p) => p.recommended);
        expect(recommended).toHaveLength(1);
        expect(recommended[0].id).toBe('unlimited');
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
