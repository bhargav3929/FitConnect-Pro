import { PlanId } from './subscription';

// ---------------------------------------------------------------------------
// Payment types — mirrors Stripe PaymentIntent pattern
// ---------------------------------------------------------------------------

export type PaymentStatus =
    | 'requires_confirmation'
    | 'processing'
    | 'succeeded'
    | 'failed';

export interface Payment {
    id: string;
    paymentIntentId: string;         // mock-generated, matches Stripe pattern
    userId: string;
    amount: number;                  // dollars
    currency: string;                // 'usd'
    status: PaymentStatus;
    planId: PlanId;
    metadata: {
        planName: string;
        planCategory: string;
        credits: number | null;
        durationDays: number;
    };
    createdAt: Date;
    paidAt: Date | null;
}
