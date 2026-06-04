import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { PLAN_CATALOG } from '@fitconnect/shared/types/subscription';
import { listRazorpayPlans, listRazorpayItems } from '@fitconnect/shared/payments/razorpay-processor';

// ISR: cache pricing for 5 minutes
export const revalidate = 300;

type PricingSource = 'plans' | 'items' | 'static';

interface PlanEntry {
    planId: string;
    name: string;
    price: number;
    razorpayPlanId: string | null;
    razorpayItemId: string | null;
    configured: boolean;
    category: string;
    source: PricingSource;
}

export async function GET() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const buildFallbackPlans = (): PlanEntry[] =>
        PLAN_CATALOG.map((plan) => ({
            planId: plan.id,
            name: plan.name,
            price: plan.price,
            razorpayPlanId: null,
            razorpayItemId: null,
            configured: false,
            category: plan.category,
            source: 'static' as PricingSource,
        }));

    if (!keyId || !keySecret) {
        return NextResponse.json({ plans: buildFallbackPlans(), lastSyncedAt: null, source: 'static' });
    }

    // ── Try Razorpay Plans API (requires Subscriptions product) ──────────────
    try {
        const razorpayPlans = await listRazorpayPlans(keyId, keySecret);

        const rzpMap = new Map<string, { razorpayPlanId: string; amountPaise: number }>();
        for (const rp of razorpayPlans) {
            if (rp.fitconnectPlanId) {
                rzpMap.set(rp.fitconnectPlanId, { razorpayPlanId: rp.id, amountPaise: rp.amount });
            }
        }

        const plans: PlanEntry[] = PLAN_CATALOG.map((plan) => {
            if (plan.category === 'class_pack') {
                return { planId: plan.id, name: plan.name, price: plan.price, razorpayPlanId: null, razorpayItemId: null, configured: false, category: plan.category, source: 'static' };
            }
            const match = rzpMap.get(plan.id);
            if (!match) {
                return { planId: plan.id, name: plan.name, price: plan.price, razorpayPlanId: null, razorpayItemId: null, configured: false, category: plan.category, source: 'static' };
            }
            return {
                planId: plan.id, name: plan.name,
                price: Math.round(match.amountPaise / 100),
                razorpayPlanId: match.razorpayPlanId, razorpayItemId: null,
                configured: true, category: plan.category, source: 'plans',
            };
        });

        const lastSyncedAt = new Date().toISOString();
        const planIdMap: Record<string, string> = {};
        for (const p of plans) {
            if (p.configured && p.razorpayPlanId) planIdMap[p.planId] = p.razorpayPlanId;
        }
        await adminDb.collection('settings').doc('razorpayPlans').set({ planIdMap, plans, lastSyncedAt, source: 'plans' });

        return NextResponse.json({ plans, lastSyncedAt, source: 'plans' });

    } catch {
        // Plans API unavailable (Subscriptions product not enabled) — fall through to Items
    }

    // ── Fall back to Razorpay Items API (always available) ───────────────────
    try {
        const rzpItems = await listRazorpayItems(keyId, keySecret);

        const itemMap = new Map<string, { itemId: string; amountPaise: number }>();
        for (const item of rzpItems) {
            if (item.fitconnectPlanId) {
                itemMap.set(item.fitconnectPlanId, { itemId: item.id, amountPaise: item.amount });
            }
        }

        const plans: PlanEntry[] = PLAN_CATALOG.map((plan) => {
            const match = itemMap.get(plan.id);
            if (!match) {
                return { planId: plan.id, name: plan.name, price: plan.price, razorpayPlanId: null, razorpayItemId: null, configured: false, category: plan.category, source: 'static' };
            }
            return {
                planId: plan.id, name: plan.name,
                price: Math.round(match.amountPaise / 100),
                razorpayPlanId: null, razorpayItemId: match.itemId,
                configured: true, category: plan.category, source: 'items',
            };
        });

        const lastSyncedAt = new Date().toISOString();
        // Items don't provide a razorpayPlanId for subscription creation — store empty map
        await adminDb.collection('settings').doc('razorpayPlans').set({ planIdMap: {}, plans, lastSyncedAt, source: 'items' });

        return NextResponse.json({ plans, lastSyncedAt, source: 'items' });

    } catch (err) {
        console.error('[pricing] Items API also failed:', err);
    }

    // ── Static fallback ───────────────────────────────────────────────────────
    return NextResponse.json({ plans: buildFallbackPlans(), lastSyncedAt: null, source: 'static' });
}
