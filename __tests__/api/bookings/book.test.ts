import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
    mockVerifyIdToken,
    mockRunTransaction,
    mockTransactionGet,
    mockTransactionSet,
    mockTransactionUpdate,
    mockBookingsQueryGet,
} = vi.hoisted(() => ({
    mockVerifyIdToken: vi.fn(),
    mockRunTransaction: vi.fn(),
    mockTransactionGet: vi.fn(),
    mockTransactionSet: vi.fn(),
    mockTransactionUpdate: vi.fn(),
    mockBookingsQueryGet: vi.fn(),
}));

const classRef = { id: 'class_123', kind: 'class' };
const userRef = { id: 'user_123', kind: 'user' };
const newBookingRef = { id: 'booking_123', kind: 'booking' };
const mockTransaction = {
    get: mockTransactionGet,
    set: mockTransactionSet,
    update: mockTransactionUpdate,
};

vi.mock('@/lib/firebase/admin', () => ({
    adminAuth: { verifyIdToken: mockVerifyIdToken },
    adminDb: {
        collection: vi.fn().mockImplementation((col: string) => {
            const query = {
                where: vi.fn(() => query),
                limit: vi.fn(() => query),
                get: mockBookingsQueryGet,
            };
            return {
                doc: vi.fn((id?: string) => {
                    if (col === 'classes') return classRef;
                    if (col === 'users') return userRef;
                    if (col === 'bookings') return id ? { id, kind: 'booking' } : newBookingRef;
                    return { id: id ?? 'doc_id', kind: col };
                }),
                where: vi.fn(() => query),
            };
        }),
        runTransaction: mockRunTransaction,
    },
}));

vi.mock('firebase-admin/firestore', () => ({
    FieldValue: {
        serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
        increment: vi.fn((value: number) => ({ __op: 'increment', value })),
        arrayUnion: vi.fn((value: unknown) => ({ __op: 'arrayUnion', value })),
    },
    Timestamp: class Timestamp {},
}));

function makeRequest(body: unknown, token = 'valid_token'): NextRequest {
    return new NextRequest('http://localhost/api/bookings/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
}

function futureDate(days = 7): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
}

function classDoc(overrides: Record<string, unknown> = {}) {
    return {
        exists: true,
        data: () => ({
            status: 'scheduled',
            date: futureDate(),
            startTime: '10:00',
            duration: 50,
            classType: 'Reformer Pilates',
            trainerId: 'trainer_123',
            totalSpots: 12,
            bookedSpots: [],
            bookedCount: 0,
            ...overrides,
        }),
    };
}

function userDoc(subscriptionOverrides: Record<string, unknown> = {}) {
    return {
        exists: true,
        data: () => ({
            name: 'Test Member',
            email: 'member@example.com',
            subscription: {
                planId: 'twice_quarterly',
                planCategory: 'membership',
                status: 'active',
                endDate: futureDate(30),
                classesRemaining: 5,
                introCreditRemaining: 0,
                maxClassesPerDay: 1,
                weeklyClassLimit: 2,
                advanceBookingDays: 14,
                guestPassesRemaining: 0,
                ...subscriptionOverrides,
            },
        }),
    };
}

function bookingDoc(data: Record<string, unknown>) {
    return { data: () => data };
}

function emptyBookingSnap() {
    return { empty: true, docs: [] };
}

describe('POST /api/bookings/book', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockVerifyIdToken.mockResolvedValue({
            uid: 'user_123',
            email: 'member@example.com',
            name: 'Test Member',
        });
        mockTransactionGet.mockImplementation(async (ref: { kind?: string }) => {
            if (ref === classRef) return classDoc();
            if (ref === userRef) return userDoc();
            return { exists: false };
        });
        mockBookingsQueryGet.mockResolvedValue(emptyBookingSnap());
        mockTransactionSet.mockReturnValue(undefined);
        mockTransactionUpdate.mockReturnValue(undefined);
        mockRunTransaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => fn(mockTransaction));
    });

    it('books a regular class and decrements standard credits', async () => {
        const { POST } = await import('@/app/api/bookings/book/route');

        const res = await POST(makeRequest({ classId: 'class_123', spotNumber: 2, isGuest: false }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ success: true, bookingId: 'booking_123' });
        expect(mockTransactionSet).toHaveBeenCalledWith(
            newBookingRef,
            expect.objectContaining({
                userId: 'user_123',
                classId: 'class_123',
                status: 'confirmed',
                spotNumber: 2,
                creditType: 'standard',
            }),
        );
        expect(mockTransactionUpdate).toHaveBeenCalledWith(
            userRef,
            expect.objectContaining({
                'subscription.classesRemaining': expect.objectContaining({ __op: 'increment', value: -1 }),
            }),
        );
    });

    it('blocks a demo plan from booking a normal class', async () => {
        mockTransactionGet.mockImplementation(async (ref: { kind?: string }) => {
            if (ref === classRef) return classDoc({ classType: 'Reformer Pilates' });
            if (ref === userRef) {
                return userDoc({
                    planId: 'drop_in',
                    planCategory: 'class_pack',
                    classesRemaining: 0,
                    introCreditRemaining: 1,
                });
            }
            return { exists: false };
        });
        const { POST } = await import('@/app/api/bookings/book/route');

        const res = await POST(makeRequest({ classId: 'class_123', spotNumber: 1, isGuest: false }));

        expect(res.status).toBe(400);
        expect((await res.json()).code).toBe('intro-plan-class-required');
    });

    it('books a Demo Class with demo credit and decrements introCreditRemaining', async () => {
        mockTransactionGet.mockImplementation(async (ref: { kind?: string }) => {
            if (ref === classRef) return classDoc({ classType: 'Demo Class' });
            if (ref === userRef) {
                return userDoc({
                    planId: 'drop_in',
                    planCategory: 'class_pack',
                    classesRemaining: 0,
                    introCreditRemaining: 1,
                });
            }
            return { exists: false };
        });
        const { POST } = await import('@/app/api/bookings/book/route');

        const res = await POST(makeRequest({ classId: 'class_123', spotNumber: 1, isGuest: false }));

        expect(res.status).toBe(200);
        expect(mockTransactionSet).toHaveBeenCalledWith(
            newBookingRef,
            expect.objectContaining({ creditType: 'intro_credit', usedIntroCredit: true }),
        );
        expect(mockTransactionUpdate).toHaveBeenCalledWith(
            userRef,
            expect.objectContaining({
                'subscription.introCreditRemaining': expect.objectContaining({ __op: 'increment', value: -1 }),
            }),
        );
    });

    it('blocks booking when the selected spot is already taken', async () => {
        mockTransactionGet.mockImplementation(async (ref: { kind?: string }) => {
            if (ref === classRef) return classDoc({ bookedSpots: [4], bookedCount: 1 });
            if (ref === userRef) return userDoc();
            return { exists: false };
        });
        const { POST } = await import('@/app/api/bookings/book/route');

        const res = await POST(makeRequest({ classId: 'class_123', spotNumber: 4, isGuest: false }));

        expect(res.status).toBe(409);
        expect((await res.json()).code).toBe('already-exists');
        expect(mockTransactionSet).not.toHaveBeenCalled();
    });

    it('blocks booking after weekly plan limit is reached', async () => {
        const date = futureDate();
        mockTransactionGet.mockImplementation(async (ref: { kind?: string }) => {
            if (ref === classRef) return classDoc({ date });
            if (ref === userRef) return userDoc({ maxClassesPerDay: 10, weeklyClassLimit: 2 });
            return { exists: false };
        });
        mockBookingsQueryGet.mockResolvedValue({
            empty: true,
            docs: [
                bookingDoc({ classDate: date, creditType: 'standard' }),
                bookingDoc({ classDate: date, creditType: 'standard' }),
            ],
        });
        const { POST } = await import('@/app/api/bookings/book/route');

        const res = await POST(makeRequest({ classId: 'class_123', spotNumber: 3, isGuest: false }));

        expect(res.status).toBe(409);
        expect((await res.json()).code).toBe('weekly-limit-reached');
        expect(mockTransactionSet).not.toHaveBeenCalled();
    });
});
