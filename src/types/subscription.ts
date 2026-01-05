export type PlanType = 'weekly' | 'monthly' | 'quarterly';

export interface SubscriptionPlan {
    id: PlanType;
    name: string;
    duration: number; // Days
    price: number;
    features: string[];
    recommended?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'weekly',
        name: 'Weekly Plan',
        duration: 7,
        price: 0,
        features: [
            'Access to all gym locations',
            'Book 1 class per day',
            'Standard booking window',
            'Email support'
        ]
    },
    {
        id: 'monthly',
        name: 'Monthly Plan',
        duration: 30,
        price: 0,
        features: [
            'Access to all gym locations',
            'Book 1 class per day',
            'Priority waitlist access',
            '24h advance booking',
            'Free guest pass (1/mo)'
        ],
        recommended: true
    },
    {
        id: 'quarterly',
        name: 'Quarterly Plan',
        duration: 90,
        price: 0,
        features: [
            'Best value',
            'Access to all gym locations',
            'Book 1 class per day',
            'Premium welcome pack',
            '1 week advance booking'
        ]
    }
];
