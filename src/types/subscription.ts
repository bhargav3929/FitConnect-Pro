// ---------------------------------------------------------------------------
// Plan catalog — 6 real plans matching the landing page pricing
// ---------------------------------------------------------------------------

export type PlanId =
    | 'unlimited'
    | 'twice_weekly'
    | 'once_weekly'
    | 'drop_in'
    | 'five_pack'
    | 'ten_pack';

export type PlanCategory = 'membership' | 'class_pack';

export interface PlanDefinition {
    id: PlanId;
    name: string;
    category: PlanCategory;
    price: number;                    // USD cents avoided — stored as dollars
    credits: number | null;           // null = unlimited
    durationDays: number;             // validity period
    maxClassesPerDay: number;
    advanceBookingDays: number;
    guestPasses: number;
    autoRenew: boolean;
    features: string[];
    recommended?: boolean;
}

export const PLAN_CATALOG: PlanDefinition[] = [
    // ── Memberships ──────────────────────────────────────────────
    {
        id: 'unlimited',
        name: 'Unlimited',
        category: 'membership',
        price: 200,
        credits: null,
        durationDays: 28,
        maxClassesPerDay: 1,
        advanceBookingDays: 14,
        guestPasses: 0,
        autoRenew: true,
        recommended: true,
        features: [
            'Unlimited classes every 4 weeks',
            '14-day advance booking window',
            'Membership auto-renews every 4 weeks',
            'Priority support',
        ],
    },
    {
        id: 'twice_weekly',
        name: 'Twice Weekly',
        category: 'membership',
        price: 160,
        credits: 8,
        durationDays: 28,
        maxClassesPerDay: 1,
        advanceBookingDays: 14,
        guestPasses: 0,
        autoRenew: true,
        features: [
            '8 classes every 4 weeks',
            '14-day advance booking window',
            'Membership auto-renews every 4 weeks',
            'Roll-over unused credits (up to 2)',
        ],
    },
    {
        id: 'once_weekly',
        name: 'Once Weekly',
        category: 'membership',
        price: 120,
        credits: 4,
        durationDays: 28,
        maxClassesPerDay: 1,
        advanceBookingDays: 14,
        guestPasses: 0,
        autoRenew: true,
        features: [
            '4 classes every 4 weeks',
            '14-day advance booking window',
            'Membership auto-renews every 4 weeks',
        ],
    },

    // ── Class Packs ──────────────────────────────────────────────
    {
        id: 'drop_in',
        name: 'Drop-In',
        category: 'class_pack',
        price: 35,
        credits: 1,
        durationDays: 30,
        maxClassesPerDay: 1,
        advanceBookingDays: 7,
        guestPasses: 0,
        autoRenew: false,
        features: [
            '1 Session Credit',
            '1 Month Expiration',
            'Valid for any standard class',
        ],
    },
    {
        id: 'five_pack',
        name: '5 Pack',
        category: 'class_pack',
        price: 160,
        credits: 5,
        durationDays: 180,
        maxClassesPerDay: 1,
        advanceBookingDays: 7,
        guestPasses: 1,
        autoRenew: false,
        features: [
            '5 Session Credits',
            '6 Month Expiration',
            'Valid for any standard class',
            'Shareable with 1 friend',
        ],
    },
    {
        id: 'ten_pack',
        name: '10 Pack',
        category: 'class_pack',
        price: 300,
        credits: 10,
        durationDays: 180,
        maxClassesPerDay: 1,
        advanceBookingDays: 7,
        guestPasses: 2,
        autoRenew: false,
        features: [
            '10 Session Credits',
            '6 Month Expiration',
            'Valid for any standard class',
            'Shareable with 2 friends',
        ],
    },
];

/** Look up a plan by ID. Returns undefined if not found. */
export function getPlanById(id: string): PlanDefinition | undefined {
    return PLAN_CATALOG.find((p) => p.id === id);
}

/** All valid plan IDs */
export const VALID_PLAN_IDS: PlanId[] = PLAN_CATALOG.map((p) => p.id);

/** Legacy mapping for backward compatibility */
export const LEGACY_PLAN_MAP: Record<string, PlanId> = {
    weekly: 'once_weekly',
    monthly: 'twice_weekly',
    quarterly: 'ten_pack',
};
