// ---------------------------------------------------------------------------
// Plan catalog — Sol Pilates membership tiers (INR)
// ---------------------------------------------------------------------------

export type PlanId =
    | 'drop_in'
    | 'kickstarter'
    | 'twice_quarterly'
    | 'twice_6mo'
    | 'thrice_quarterly'
    | 'thrice_6mo';

export type PlanCategory = 'membership' | 'class_pack';

export interface PlanDefinition {
    id: PlanId;
    name: string;
    category: PlanCategory;
    price: number;                    // INR rupees
    foundingPrice?: number;           // INR rupees, for first 25 members
    credits: number | null;           // null = unlimited
    durationDays: number;             // validity period
    maxClassesPerDay: number;
    weeklyClassLimit: number;
    advanceBookingDays: number;
    guestPasses: number;
    autoRenew: boolean;
    /** Razorpay Plan ID for membership subscriptions. Set by running scripts/create-razorpay-plans.ts. */
    razorpayPlanId?: string;
    /** Billing period for Razorpay (monthly + interval). */
    razorpayPeriod?: 'monthly';
    /** Billing interval in months (3 = quarterly, 6 = halfyearly). */
    razorpayInterval?: number;
    /** Total billing cycles before subscription completes (large = effectively indefinite). */
    razorpayTotalCount?: number;
    features: string[];
    tagline?: string;
    recommended?: boolean;
    requiresConsultation?: boolean;
}

export const PLAN_CATALOG: PlanDefinition[] = [
    // ── Demo Class ────────────────────────────────────────────────
    {
        id: 'drop_in',
        name: 'Demo Class',
        category: 'class_pack',
        price: 1000,
        credits: 1,
        durationDays: 30,
        maxClassesPerDay: 1,
        weeklyClassLimit: 1,
        advanceBookingDays: 7,
        guestPasses: 0,
        autoRenew: false,
        tagline: 'Try a 30-minute demo class with no commitment.',
        features: [
            '1 demo 30-minute session',
            'SolMare coupon',
            'No commitment',
            'New clients only',
        ],
    },

    // ── 2-week intro program ─────────────────────────────────────
    {
        id: 'kickstarter',
        name: 'Sol Intro Program',
        category: 'class_pack',
        price: 5000,
        credits: 4,
        durationDays: 14,
        maxClassesPerDay: 1,
        weeklyClassLimit: 2,
        advanceBookingDays: 14,
        guestPasses: 0,
        autoRenew: false,
        requiresConsultation: true,
        tagline: "New to Pilates or just new to us? Start with a private 30-minute session with Swetha, then continue with 4 group classes over 2 weeks — enough to feel the difference.",
        features: [
            'Private 30-min consult with Swetha',
            '4 group classes over 2 weeks',
            '2 classes per week',
            'Designed for new clients',
        ],
    },

    // ── 2x / week ────────────────────────────────────────────────
    {
        id: 'twice_quarterly',
        name: '2x Weekly · Quarterly',
        category: 'membership',
        price: 40800,
        foundingPrice: 34680,
        credits: 24,
        durationDays: 90,
        maxClassesPerDay: 1,
        weeklyClassLimit: 2,
        advanceBookingDays: 14,
        guestPasses: 0,
        autoRenew: true,
        razorpayPlanId: 'plan_T0NFMqtWE33vfu',
        razorpayPeriod: 'monthly',
        razorpayInterval: 3,
        razorpayTotalCount: 24,
        tagline: 'Twice a week, every week, for 3 months. Enough to build a real habit.',
        features: [
            '2 classes per week',
            '3 months validity',
            '24 total credits',
            '14-day advance booking',
        ],
    },
    {
        id: 'twice_6mo',
        name: '2x Weekly · 6 Months',
        category: 'membership',
        price: 72000,
        foundingPrice: 61200,
        credits: 48,
        durationDays: 180,
        maxClassesPerDay: 1,
        weeklyClassLimit: 2,
        advanceBookingDays: 14,
        guestPasses: 1,
        autoRenew: true,
        razorpayPlanId: 'plan_T0NFN9EZCVqLK6',
        razorpayPeriod: 'monthly',
        razorpayInterval: 6,
        razorpayTotalCount: 12,
        tagline: 'Six months of showing up twice a week. This is where real change happens.',
        features: [
            '2 classes per week',
            '6 months validity',
            '48 total credits',
            '1 guest pass',
        ],
    },

    // ── 3x / week ────────────────────────────────────────────────
    {
        id: 'thrice_quarterly',
        name: '3x Weekly · Quarterly',
        category: 'membership',
        price: 61200,
        foundingPrice: 52020,
        credits: 36,
        durationDays: 90,
        maxClassesPerDay: 1,
        weeklyClassLimit: 3,
        advanceBookingDays: 14,
        guestPasses: 0,
        autoRenew: true,
        razorpayPlanId: 'plan_T0NFNLzLMwSZuw',
        razorpayPeriod: 'monthly',
        razorpayInterval: 3,
        razorpayTotalCount: 24,
        recommended: true,
        tagline: "Three times a week for 3 months. You'll feel it faster than you think.",
        features: [
            '3 classes per week',
            '3 months validity',
            '36 total credits',
            '14-day advance booking',
        ],
    },
    {
        id: 'thrice_6mo',
        name: '3x Weekly · 6 Months',
        category: 'membership',
        price: 108000,
        foundingPrice: 91800,
        credits: 72,
        durationDays: 180,
        maxClassesPerDay: 1,
        weeklyClassLimit: 3,
        advanceBookingDays: 14,
        guestPasses: 2,
        autoRenew: true,
        razorpayPlanId: 'plan_T0NFNWxVzZIXkw',
        razorpayPeriod: 'monthly',
        razorpayInterval: 6,
        razorpayTotalCount: 12,
        tagline: 'Three days a week, six months in. Pain-free, stronger, and completely different.',
        features: [
            '3 classes per week',
            '6 months validity',
            '72 total credits',
            '2 guest passes',
        ],
    },
];

/** Look up a plan by ID. Returns undefined if not found. */
export function getPlanById(id: string): PlanDefinition | undefined {
    return PLAN_CATALOG.find((p) => p.id === id);
}

/** All valid plan IDs */
export const VALID_PLAN_IDS: PlanId[] = PLAN_CATALOG.map((p) => p.id);

/** Legacy mapping for backward compatibility with old plan IDs */
export const LEGACY_PLAN_MAP: Record<string, PlanId> = {
    weekly: 'twice_quarterly',
    monthly: 'twice_quarterly',
    quarterly: 'twice_quarterly',
    unlimited: 'thrice_6mo',
    twice_weekly: 'twice_quarterly',
    once_weekly: 'kickstarter',
    five_pack: 'twice_quarterly',
    ten_pack: 'twice_6mo',
};
