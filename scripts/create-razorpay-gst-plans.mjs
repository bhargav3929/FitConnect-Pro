/**
 * Creates GST-inclusive Razorpay Plans for every membership tier.
 *
 * Catalog prices are GST-exclusive and the member pays base + 18% on top. For
 * one-time Orders our own code does that sum, but a Subscription is charged
 * whatever its Razorpay Plan says, and plan amounts are immutable - so adding
 * GST to memberships means creating new plans and pointing the app at them.
 *
 * The app finds plans by their notes (fitconnect_plan_id / fitconnect_variant)
 * and, when several match, picks the most recently created one. That means:
 *
 *   *** THE MOMENT THESE PLANS EXIST, NEW MEMBERSHIP SIGN-UPS ARE SOLD AT THE
 *   *** GST-INCLUSIVE PRICE - no deploy required, once the 5-minute pricing
 *   *** cache expires. Run this only when you intend that to go live.
 *
 * Existing subscribers are unaffected: their subscription references the old
 * plan id and keeps billing the old amount until they change plans.
 *
 * Usage:
 *   node scripts/create-razorpay-gst-plans.mjs                 # dry run
 *   node scripts/create-razorpay-gst-plans.mjs --apply         # creates plans
 *   RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... node ... --apply   # live keys
 */
import Razorpay from 'razorpay';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const env = {};
readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
});

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? env.RAZORPAY_KEY_SECRET;
const APPLY = process.argv.includes('--apply');

if (!KEY_ID || !KEY_SECRET) {
    console.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing.');
    process.exit(1);
}

const GST_RATE_BPS = 1800;
const withGst = (rupees) => {
    const basePaise = Math.round(rupees * 100);
    const gstPaise = Math.round((basePaise * GST_RATE_BPS) / 10000);
    return { basePaise, gstPaise, totalPaise: basePaise + gstPaise };
};
const fmt = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

// Mirrored from shared/src/types/subscription.ts (membership tiers only).
const MEMBERSHIPS = [
    { planId: 'twice_quarterly',  name: '2x Weekly · Quarterly', price: 40800,  foundingPrice: 34680, period: 'monthly', interval: 3 },
    { planId: 'twice_6mo',        name: '2x Weekly · 6 Months',  price: 72000,  foundingPrice: 61200, period: 'monthly', interval: 6 },
    { planId: 'thrice_quarterly', name: '3x Weekly · Quarterly', price: 61200,  foundingPrice: 52020, period: 'monthly', interval: 3 },
    { planId: 'thrice_6mo',       name: '3x Weekly · 6 Months',  price: 108000, foundingPrice: 91800, period: 'monthly', interval: 6 },
];

const targets = [];
for (const m of MEMBERSHIPS) {
    targets.push({ ...m, variant: 'standard', amountRupees: m.price });
    targets.push({ ...m, variant: 'founding', amountRupees: m.foundingPrice });
}

const isLive = !KEY_ID.startsWith('rzp_test');
console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} - ${isLive ? 'LIVE' : 'TEST'} account (${KEY_ID})\n`);
console.log('plan                 variant    base        GST @18%    charged');
console.log('─'.repeat(72));
for (const t of targets) {
    const g = withGst(t.amountRupees);
    console.log(
        `${t.planId.padEnd(20)} ${t.variant.padEnd(10)} ${fmt(g.basePaise).padEnd(11)} ${fmt(g.gstPaise).padEnd(11)} ${fmt(g.totalPaise)}`,
    );
}

if (!APPLY) {
    console.log('\nNothing created. Re-run with --apply to create these plans.');
    console.log('WARNING: creating them changes what new members are charged, without a deploy.');
    process.exit(0);
}

const rzp = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
const created = [];

console.log('');
for (const t of targets) {
    const g = withGst(t.amountRupees);
    try {
        const plan = await rzp.plans.create({
            period: t.period,
            interval: t.interval,
            item: {
                name: `${t.name}${t.variant === 'founding' ? ' (Founding)' : ''} - incl. GST`,
                amount: g.totalPaise,
                currency: 'INR',
            },
            notes: {
                fitconnect_plan_id: t.planId,
                fitconnect_variant: t.variant,
                fitconnect_gst_bps: String(GST_RATE_BPS),
                fitconnect_base_paise: String(g.basePaise),
            },
        });
        created.push({ ...t, razorpayPlanId: plan.id, totalPaise: g.totalPaise });
        console.log(`✓ ${t.planId} (${t.variant}) → ${plan.id}  ${fmt(g.totalPaise)}`);
    } catch (err) {
        const msg = err && typeof err === 'object' && 'error' in err ? JSON.stringify(err.error) : String(err);
        console.error(`✗ ${t.planId} (${t.variant}): ${msg}`);
    }
}

console.log(`\nCreated ${created.length}/${targets.length} plans.`);
if (created.length) {
    console.log('Run `node scripts/bust-pricing-cache.mjs` so the app picks them up immediately.');
}
process.exit(created.length === targets.length ? 0 : 1);
