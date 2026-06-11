/**
 * Run once after enabling Razorpay Subscriptions in your dashboard:
 *   npx tsx scripts/create-razorpay-plans.ts
 *
 * Prerequisites:
 *   1. Enable Subscriptions: Razorpay Dashboard → Subscriptions → Activate
 *   2. RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set in .env.local
 *
 * What it does:
 *   Creates 4 Razorpay Plans (one per membership tier) and prints the
 *   razorpayPlanId values to paste into shared/src/types/subscription.ts.
 */

import Razorpay from 'razorpay';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

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

const PLANS = [
    { planId: 'twice_quarterly',  name: '2x Weekly · Quarterly', amountRupees: 40800, period: 'monthly' as const, interval: 3,  totalCount: 24 },
    { planId: 'twice_6mo',        name: '2x Weekly · 6 Months',  amountRupees: 72000, period: 'monthly' as const, interval: 6,  totalCount: 12 },
    { planId: 'thrice_quarterly', name: '3x Weekly · Quarterly', amountRupees: 61200, period: 'monthly' as const, interval: 3,  totalCount: 24 },
    { planId: 'thrice_6mo',       name: '3x Weekly · 6 Months',  amountRupees: 108000, period: 'monthly' as const, interval: 6,  totalCount: 12 },
];

async function main() {
    console.log(`Creating ${PLANS.length} Razorpay plans on ${KEY_ID.startsWith('rzp_test') ? 'TEST' : 'LIVE'} account...\n`);

    const results: Array<{ planId: string; razorpayPlanId: string }> = [];

    for (const p of PLANS) {
        try {
            const plan = await rzp.plans.create({
                period: p.period,
                interval: p.interval,
                item: { name: p.name, amount: p.amountRupees * 100, currency: 'INR' },
                notes: { fitconnect_plan_id: p.planId },
            });
            results.push({ planId: p.planId, razorpayPlanId: plan.id });
            console.log(`✓ ${p.planId} → ${plan.id}`);
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'error' in err
                ? JSON.stringify((err as { error: unknown }).error)
                : String(err);
            console.error(`✗ ${p.planId}: ${msg}`);
        }
    }

    if (results.length === 0) {
        console.error('\nNo plans created. Make sure Subscriptions is enabled in your Razorpay dashboard.');
        process.exit(1);
    }

    console.log('\n── Paste these razorpayPlanId values into shared/src/types/subscription.ts ──\n');
    for (const r of results) {
        console.log(`  // ${r.planId}`);
        console.log(`  razorpayPlanId: '${r.razorpayPlanId}',\n`);
    }
}

main().catch(e => { console.error(e); process.exit(1); });
