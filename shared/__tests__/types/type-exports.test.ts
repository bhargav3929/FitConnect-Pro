import { describe, it, expect } from 'vitest';
import type { Booking } from '../../src/types/booking';
import type { ClassSession, SpotSelection } from '../../src/types/class';
import type { UserProfile } from '../../src/types/user';
import type { ClientUser } from '../../src/types/client';
import type { AdminUser } from '../../src/types/admin';
import type { Trainer } from '../../src/types/trainer';
import type { GymCenter } from '../../src/types/gym';
import type { Payment, PaymentStatus } from '../../src/types/payment';
import type { PlanId, PlanCategory, PlanDefinition } from '../../src/types/subscription';

// These tests verify that all type exports compile correctly and
// have the expected shape. They use type assertions at runtime to
// confirm the interfaces are usable.

describe('type exports', () => {
    it('Booking has required fields', () => {
        const mock: Booking = {
            id: 'b1',
            userId: 'u1',
            classId: 'c1',
            trainerId: 't1',
            classDate: new Date(),
            bookingDate: new Date(),
            spotNumber: 1,
            isGuest: false,
            status: 'confirmed',
            creditType: 'standard',
            planIdAtBooking: null,
            usedGuestPass: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        expect(mock.id).toBe('b1');
        expect(mock.status).toBe('confirmed');
    });

    it('ClassSession has required fields', () => {
        const mock: ClassSession = {
            id: 'c1',
            trainerId: 't1',
            date: new Date(),
            startTime: '09:00',
            duration: 60,
            capacity: 12,
            bookedCount: 3,
            status: 'scheduled',
        };
        expect(mock.id).toBe('c1');
        expect(mock.status).toBe('scheduled');
    });

    it('SpotSelection has required fields', () => {
        const mock: SpotSelection = {
            spotNumber: 5,
            isGuest: false,
        };
        expect(mock.spotNumber).toBe(5);
    });

    it('AdminUser has required fields', () => {
        const mock: AdminUser = {
            uid: 'a1',
            role: 'admin',
            name: 'Admin',
            email: 'admin@test.com',
        };
        expect(mock.role).toBe('admin');
    });

    it('Trainer has required fields', () => {
        const mock: Trainer = {
            id: 't1',
            name: 'John',
            email: 'john@test.com',
            phone: '555-0100',
            bio: 'Test bio',
            certifications: ['PMA'],
            specialties: ['Reformer'],
            profilePictureUrl: '',
            experienceYears: 5,
            isActive: true,
        };
        expect(mock.id).toBe('t1');
    });

    it('PlanId union accepts valid values', () => {
        const ids: PlanId[] = ['unlimited', 'twice_weekly', 'once_weekly', 'drop_in', 'five_pack', 'ten_pack'];
        expect(ids).toHaveLength(6);
    });

    it('PlanCategory union accepts valid values', () => {
        const cats: PlanCategory[] = ['membership', 'class_pack'];
        expect(cats).toHaveLength(2);
    });

    it('PaymentStatus accepts valid values', () => {
        const statuses: PaymentStatus[] = ['requires_confirmation', 'processing', 'succeeded', 'failed'];
        expect(statuses).toHaveLength(4);
    });
});

describe('barrel export from types/index', () => {
    it('re-exports everything from a single import', async () => {
        const types = await import('../../src/types/index');
        expect(types.PLAN_CATALOG).toBeDefined();
        expect(types.getPlanById).toBeDefined();
        expect(types.VALID_PLAN_IDS).toBeDefined();
        expect(types.LEGACY_PLAN_MAP).toBeDefined();
    });
});
