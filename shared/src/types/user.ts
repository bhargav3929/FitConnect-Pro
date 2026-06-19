import { PlanId, PlanCategory } from './subscription';

export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    displayName?: string;
    age: number;
    fitnessGoals: string[];
    profilePictureUrl?: string;
    isFoundingMember: boolean;       // true for first 25 non-admin sign-ups
    createdAt: Date;
    updatedAt: Date;
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
    address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
    };
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    stats: {
        totalClassesAttended: number;
        currentStreak: number;
        longestStreak: number;
        lastAttendedDate?: Date;
    };
}
