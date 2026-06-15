/**
 * Run once after enabling Razorpay Subscriptions in your dashboard:
 *   npx tsx scripts/create-razorpay-founding-plans.ts
 *
 * Prerequisites:
 *   1. Enable Subscriptions: Razorpay Dashboard -> Subscriptions -> Activate
 *   2. RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set in .env.local
 *
 * What it does:
 *   Creates one discounted Razorpay Plan per membership tier that has a
 *   foundingPrice. The app discovers these plans by Razorpay notes:
 *     fitconnect_plan_id=<plan id>
 *     fitconnect_variant=founding
 */

import Razorpay from 'razorpay';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { PLAN_CATALOG } from '../shared/src/types/subscription';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const get = (key: string) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.replace(/['"]/g, '') ?? '';

const KEY_ID = get('RAZORPAY_KEY_ID');
const KEY_SECRET = get('RAZORPAY_KEY_SECRET');

if (!KEY_ID || !KEY_SECRET) {
    console.error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing from .env.local');
    process.exit(1);
}

const rzp = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

const PLANS = PLAN_CATALOG
    .filter((plan) => plan.category === 'membership' && typeof plan.foundingPrice === 'number')
    .map((plan) => ({
        planId: plan.id,
        name: `${plan.name} - Founding`,
        amountRupees: plan.foundingPrice!,
        period: 'monthly' as const,
        interval: plan.durationDays >= 180 ? 6 : 3,
        totalCount: plan.razorpayTotalCount ?? 24,
    }));

async function main() {
    console.log(`Creating ${PLANS.length} founding Razorpay plans on ${KEY_ID.startsWith('rzp_test') ? 'TEST' : 'LIVE'} account...\n`);

    const results: Array<{ planId: string; razorpayPlanId: string; amountRupees: number }> = [];

    for (const p of PLANS) {
        try {
            const plan = await rzp.plans.create({
                period: p.period,
                interval: p.interval,
                item: { name: p.name, amount: p.amountRupees * 100, currency: 'INR' },
                notes: {
                    fitconnect_plan_id: p.planId,
                    fitconnect_variant: 'founding',
                },
            });
            results.push({ planId: p.planId, razorpayPlanId: plan.id, amountRupees: p.amountRupees });
            console.log(`OK ${p.planId} (${p.amountRupees}) -> ${plan.id}`);
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'error' in err
                ? JSON.stringify((err as { error: unknown }).error)
                : String(err);
            console.error(`ERR ${p.planId}: ${msg}`);
        }
    }

    if (results.length === 0) {
        console.error('\nNo founding plans created. Make sure Subscriptions is enabled in your Razorpay dashboard.');
        process.exit(1);
    }

    console.log('\nCreated founding plan variants. The app will pick them up on the next /api/subscriptions/pricing sync.');
    console.log('If you need it immediately, wait five minutes for the cache or clear settings/razorpayPlans in Firestore and hit the pricing endpoint.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
