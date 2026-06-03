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
        status: 'active' | 'expired' | 'canceled';
        classesRemaining: number | null;      // null = unlimited
        maxClassesPerDay: number;
        weeklyClassLimit: number;
        advanceBookingDays: number;
        guestPassesRemaining: number;
        lastPaymentId: string | null;
        autoRenew: boolean;
        razorpaySubscriptionId: string | null;
    };
    stats: {
        totalClassesAttended: number;
        currentStreak: number;
        longestStreak: number;
        lastAttendedDate?: Date;
    };
}
