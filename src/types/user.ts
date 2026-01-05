export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    displayName?: string;
    age: number;
    fitnessGoals: string[];
    profilePictureUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    subscription: {
        planType: 'weekly' | 'monthly' | 'quarterly' | null;
        startDate: Date | null;
        endDate: Date | null;
        status: 'active' | 'expired' | 'canceled';
        classesRemaining: number;
    };
    stats: {
        totalClassesAttended: number;
        currentStreak: number;
        longestStreak: number;
        lastAttendedDate?: Date;
    };
}
