export interface ClientUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
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
    };
}
