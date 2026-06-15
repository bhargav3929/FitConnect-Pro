import { describe, it, expect, vi } from 'vitest';

// Mock Firebase modules before any imports
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
    GoogleAuthProvider: vi.fn(),
    OAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signInWithCredential: vi.fn(),
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

describe('shared package integration from mobile', () => {
    it('imports types correctly', async () => {
        const { PLAN_CATALOG, getPlanById, VALID_PLAN_IDS } = await import(
            '@fitconnect/shared/types/subscription'
        );
        expect(PLAN_CATALOG).toHaveLength(6);
        expect(getPlanById('thrice_quarterly')?.price).toBe(61200);
        expect(VALID_PLAN_IDS).toContain('drop_in');
    });

    it('imports api-config correctly', async () => {
        const { initApiConfig, getApiBaseUrl } = await import(
            '@fitconnect/shared/firebase/api-config'
        );
        initApiConfig({ baseUrl: 'https://test.example.com' });
        expect(getApiBaseUrl()).toBe('https://test.example.com');

        // Reset
        initApiConfig({ baseUrl: '' });
    });

    it('imports stores correctly', async () => {
        const { useClientAuthStore } = await import(
            '@fitconnect/shared/stores/clientAuthStore'
        );
        expect(typeof useClientAuthStore).toBe('function');

        const state = useClientAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(true);
    });

    it('imports uiStore correctly', async () => {
        const { useUIStore } = await import('@fitconnect/shared/stores/uiStore');
        expect(typeof useUIStore).toBe('function');

        const state = useUIStore.getState();
        expect(state.isSidebarOpen).toBe(false);
    });

    it('imports mock payment processor', async () => {
        const { processPayment } = await import(
            '@fitconnect/shared/payments/mock-processor'
        );
        const result = await processPayment(100);
        expect(result.success).toBe(true);
        expect(result.paymentIntentId).toMatch(/^pi_mock_/);
    });
});
