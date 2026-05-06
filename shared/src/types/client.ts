import { PlanId, PlanCategory } from './subscription';

export interface ClientUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isFoundingMember?: boolean;
    subscription: {
        planId: PlanId | null;
        planCategory: PlanCategory | null;
        startDate: Date | null;
        endDate: Date | null;
        status: 'active' | 'expired' | 'canceled';
        classesRemaining: number | null;      // null = unlimited
        maxClassesPerDay: number;
        advanceBookingDays: number;
        guestPassesRemaining: number;
        lastPaymentId: string | null;
        stripeCustomerId: string | null;
        stripeSubscriptionId: string | null;
    };
    stats: {
        totalClassesAttended: number;
        currentStreak: number;
        longestStreak: number;
    };
}
