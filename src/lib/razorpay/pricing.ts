import { adminDb } from '@/lib/firebase/admin';
import { PLAN_CATALOG, type PlanDefinition, type PlanId } from '@fitconnect/shared/types/subscription';
import { listRazorpayItems, listRazorpayPlans } from '@fitconnect/shared/payments/razorpay-processor';

export type PricingSource = 'plans' | 'items' | 'static';

export interface SyncedPlanEntry {
    planId: string;
    name: string;
    price: number;
    razorpayPlanId: string | null;
    razorpayItemId: string | null;
    configured: boolean;
    category: string;
    source: PricingSource;
}

export interface SyncedPricing {
    plans: SyncedPlanEntry[];
    lastSyncedAt: string | null;
    source: PricingSource;
}

const PRICING_CACHE_MS = 5 * 60 * 1000;

function buildFallbackPlans(): SyncedPlanEntry[] {
    return PLAN_CATALOG.map((plan) => ({
        planId: plan.id,
        name: plan.name,
        price: plan.price,
        razorpayPlanId: null,
        razorpayItemId: null,
        configured: false,
        category: plan.category,
        source: 'static',
    }));
}

function getSyncSource(plans: SyncedPlanEntry[]): PricingSource {
    if (plans.some((plan) => plan.source === 'plans')) return 'plans';
    if (plans.some((plan) => plan.source === 'items')) return 'items';
    return 'static';
}

function toMillis(value: unknown): number | null {
    if (!value) return null;
    if (typeof value === 'string' || typeof value === 'number') {
        const time = new Date(value).getTime();
        return Number.isNaN(time) ? null : time;
    }
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate().getTime();
    }
    return null;
}

function normalizeStoredPricing(data: Record<string, unknown> | undefined): SyncedPricing | null {
    const plans = data?.plans;
    if (!Array.isArray(plans)) return null;

    return {
        plans: plans as SyncedPlanEntry[],
        lastSyncedAt: typeof data?.lastSyncedAt === 'string' ? data.lastSyncedAt : null,
        source: (data?.source as PricingSource | undefined) ?? getSyncSource(plans as SyncedPlanEntry[]),
    };
}

export async function syncRazorpayPricing(): Promise<SyncedPricing> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return { plans: buildFallbackPlans(), lastSyncedAt: null, source: 'static' };
    }

    const planMap = new Map<string, { razorpayPlanId: string; amountPaise: number }>();
    const itemMap = new Map<string, { itemId: string; amountPaise: number }>();

    // Build a set of pinned Razorpay plan IDs from PLAN_CATALOG so we always
    // prefer those over any older plans that share the same fitconnect_plan_id note.
    const pinnedPlanIds = new Set(
        PLAN_CATALOG.filter((p) => p.razorpayPlanId).map((p) => p.razorpayPlanId as string),
    );

    try {
        const razorpayPlans = await listRazorpayPlans(keyId, keySecret);
        for (const plan of razorpayPlans) {
            if (!plan.fitconnectPlanId) continue;
            const existing = planMap.get(plan.fitconnectPlanId);
            // If we already have a pinned plan for this ID, skip non-pinned entries.
            if (existing && pinnedPlanIds.has(existing.razorpayPlanId)) continue;
            planMap.set(plan.fitconnectPlanId, {
                razorpayPlanId: plan.id,
                amountPaise: plan.amount,
            });
        }
    } catch (error) {
        console.warn('[pricing] Razorpay Plans sync failed:', error);
    }

    try {
        const razorpayItems = await listRazorpayItems(keyId, keySecret);
        for (const item of razorpayItems) {
            if (item.fitconnectPlanId) {
                itemMap.set(item.fitconnectPlanId, {
                    itemId: item.id,
                    amountPaise: item.amount,
                });
            }
        }
    } catch (error) {
        console.warn('[pricing] Razorpay Items sync failed:', error);
    }

    const plans: SyncedPlanEntry[] = PLAN_CATALOG.map((plan) => {
        const planMatch = planMap.get(plan.id);
        const itemMatch = itemMap.get(plan.id);

        if (plan.category === 'membership' && planMatch) {
            return {
                planId: plan.id,
                name: plan.name,
                price: Math.round(planMatch.amountPaise / 100),
                razorpayPlanId: planMatch.razorpayPlanId,
                razorpayItemId: itemMatch?.itemId ?? null,
                configured: true,
                category: plan.category,
                source: 'plans',
            };
        }

        if (itemMatch) {
            return {
                planId: plan.id,
                name: plan.name,
                price: Math.round(itemMatch.amountPaise / 100),
                razorpayPlanId: planMatch?.razorpayPlanId ?? null,
                razorpayItemId: itemMatch.itemId,
                configured: true,
                category: plan.category,
                source: 'items',
            };
        }

        return {
            planId: plan.id,
            name: plan.name,
            price: plan.price,
            razorpayPlanId: plan.razorpayPlanId ?? null,
            razorpayItemId: null,
            configured: false,
            category: plan.category,
            source: 'static',
        };
    });

    const lastSyncedAt = new Date().toISOString();
    const source = getSyncSource(plans);
    const planIdMap: Record<string, string> = {};
    const itemIdMap: Record<string, string> = {};

    for (const plan of plans) {
        if (plan.razorpayPlanId) planIdMap[plan.planId] = plan.razorpayPlanId;
        if (plan.razorpayItemId) itemIdMap[plan.planId] = plan.razorpayItemId;
    }

    await adminDb.collection('settings').doc('razorpayPlans').set({
        planIdMap,
        itemIdMap,
        plans,
        lastSyncedAt,
        source,
    });

    return { plans, lastSyncedAt, source };
}

export async function getSyncedPricing(): Promise<SyncedPricing> {
    try {
        const settingsDoc = await adminDb.collection('settings').doc('razorpayPlans').get();
        const data = settingsDoc.exists ? settingsDoc.data() : undefined;
        const stored = normalizeStoredPricing(data);
        const lastSyncedAt = toMillis(data?.lastSyncedAt);

        if (stored && lastSyncedAt && Date.now() - lastSyncedAt < PRICING_CACHE_MS) {
            return stored;
        }
    } catch (error) {
        console.warn('[pricing] Failed to read stored Razorpay pricing:', error);
    }

    try {
        return await syncRazorpayPricing();
    } catch (error) {
        console.error('[pricing] Failed to sync Razorpay pricing:', error);
        return { plans: buildFallbackPlans(), lastSyncedAt: null, source: 'static' };
    }
}

export async function getSyncedPlanEntry(planId: string): Promise<SyncedPlanEntry | null> {
    const pricing = await getSyncedPricing();
    return pricing.plans.find((plan) => plan.planId === planId) ?? null;
}

export async function getPlanIdForRazorpayPlanId(razorpayPlanId: string): Promise<PlanId | null> {
    const pricing = await getSyncedPricing();
    const syncedMatch = pricing.plans.find((plan) => plan.razorpayPlanId === razorpayPlanId);
    if (syncedMatch) return syncedMatch.planId as PlanId;

    const staticMatch = PLAN_CATALOG.find((plan) => plan.razorpayPlanId === razorpayPlanId);
    return staticMatch?.id ?? null;
}

export function getChargeAmount(plan: PlanDefinition, syncedPlan: SyncedPlanEntry | null, isFoundingMember: boolean): number {
    const basePrice = syncedPlan?.price ?? plan.price;
    if (!isFoundingMember || !plan.foundingPrice || plan.price <= 0) {
        return basePrice;
    }

    return Math.round(basePrice * (plan.foundingPrice / plan.price));
}
