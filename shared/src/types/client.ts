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
        status: 'active' | 'expired' | 'canceled' | 'pending' | 'halted';
        classesRemaining: number | null;      // null = unlimited
        introCreditRemaining: number;
        maxClassesPerDay: number;
        weeklyClassLimit: number;
        advanceBookingDays: number;
        guestPassesRemaining: number;
        lastPaymentId: string | null;
        autoRenew: boolean;
        cancelAtPeriodEnd?: boolean;
        canceledAt?: Date | null;
        razorpaySubscriptionId: string | null;
        razorpayPlanId?: string | null;
        pendingPlanId?: PlanId | null;
        pendingRazorpayPlanId?: string | null;
        pendingPlanEffectiveAt?: Date | null;
        lastSyncedAt?: Date | null;
        kickstarterCreditsCarriedForward?: boolean;
        carriedForwardCredits?: number;
    };
    stats: {
        totalClassesAttended: number;
        currentStreak: number;
        longestStreak: number;
    };
}
