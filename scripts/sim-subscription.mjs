/**
 * Simulates subscription states on Ashok's test account.
 * Usage: node scripts/sim-subscription.mjs <state>
 * States: active | canceled | expired | kickstarter | drop_in | none
 *         founding-on | founding-off  (toggle isFoundingMember only)
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

// Parse .env.local manually
const env = {};
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
});

// Strip surrounding quotes if present (common in .env.local for JSON values)
let saRaw = env.FIREBASE_SERVICE_ACCOUNT;
if (saRaw.startsWith('"') && saRaw.endsWith('"')) saRaw = saRaw.slice(1, -1);
saRaw = saRaw.replace(/\\"/g, '"');
const serviceAccount = JSON.parse(saRaw);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

const USER_EMAIL = 'ashok@test1.com';
const state = process.argv[2] || 'active';

const now = new Date();
const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // +90 days
const past   = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // -10 days

const STATES = {
    // Active membership (twice_quarterly, 18 credits left, auto-renew on)
    active: {
        planId: 'twice_quarterly',
        planCategory: 'membership',
        status: 'active',
        startDate: Timestamp.fromDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
        endDate: Timestamp.fromDate(future),
        classesRemaining: 18,
        introCreditRemaining: 0,
        maxClassesPerDay: 1,
        weeklyClassLimit: 2,
        advanceBookingDays: 14,
        guestPassesRemaining: 0,
        autoRenew: true,
        cancelAtPeriodEnd: false,
        razorpaySubscriptionId: 'sub_test_active123',
        razorpayPlanId: 'plan_T0NFMqtWE33vfu',
        lastPaymentId: 'pay_test_001',
        lastSyncedAt: Timestamp.fromDate(now),
    },

    // Active but renewal canceled (cancelAtPeriodEnd = true)
    canceled: {
        planId: 'thrice_quarterly',
        planCategory: 'membership',
        status: 'active',
        startDate: Timestamp.fromDate(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)),
        endDate: Timestamp.fromDate(future),
        classesRemaining: 22,
        introCreditRemaining: 0,
        maxClassesPerDay: 1,
        weeklyClassLimit: 3,
        advanceBookingDays: 14,
        guestPassesRemaining: 0,
        autoRenew: true,
        cancelAtPeriodEnd: true,
        canceledAt: Timestamp.fromDate(now),
        razorpaySubscriptionId: 'sub_test_canceled456',
        razorpayPlanId: 'plan_T0NFNLzLMwSZuw',
        lastPaymentId: 'pay_test_002',
        lastSyncedAt: Timestamp.fromDate(now),
    },

    // Expired subscription
    expired: {
        planId: 'twice_quarterly',
        planCategory: 'membership',
        status: 'expired',
        startDate: Timestamp.fromDate(new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000)),
        endDate: Timestamp.fromDate(past),
        classesRemaining: 0,
        introCreditRemaining: 0,
        maxClassesPerDay: 1,
        weeklyClassLimit: 2,
        advanceBookingDays: 14,
        guestPassesRemaining: 0,
        autoRenew: false,
        cancelAtPeriodEnd: false,
        razorpaySubscriptionId: null,
        razorpayPlanId: null,
        lastPaymentId: 'pay_test_003',
        lastSyncedAt: Timestamp.fromDate(now),
    },

    // Kickstarter class pack (4 credits, 2 weeks)
    kickstarter: {
        planId: 'kickstarter',
        planCategory: 'class_pack',
        status: 'active',
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)),
        classesRemaining: 3,
        introCreditRemaining: 0,
        maxClassesPerDay: 1,
        weeklyClassLimit: 2,
        advanceBookingDays: 14,
        guestPassesRemaining: 0,
        autoRenew: false,
        cancelAtPeriodEnd: false,
        razorpaySubscriptionId: null,
        razorpayPlanId: null,
        lastPaymentId: 'pay_test_004',
        lastSyncedAt: Timestamp.fromDate(now),
    },

    // Drop-in / intro class (1 credit)
    drop_in: {
        planId: 'drop_in',
        planCategory: 'class_pack',
        status: 'active',
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
        classesRemaining: 0,
        introCreditRemaining: 1,
        maxClassesPerDay: 1,
        weeklyClassLimit: 1,
        advanceBookingDays: 7,
        guestPassesRemaining: 0,
        autoRenew: false,
        cancelAtPeriodEnd: false,
        razorpaySubscriptionId: null,
        razorpayPlanId: null,
        lastPaymentId: 'pay_test_005',
        lastSyncedAt: Timestamp.fromDate(now),
    },

    // No subscription
    none: {
        planId: null,
        planCategory: null,
        status: 'expired',
        startDate: null,
        endDate: null,
        classesRemaining: 0,
        introCreditRemaining: 0,
        maxClassesPerDay: 1,
        weeklyClassLimit: 0,
        advanceBookingDays: 0,
        guestPassesRemaining: 0,
        autoRenew: false,
        cancelAtPeriodEnd: false,
        razorpaySubscriptionId: null,
        razorpayPlanId: null,
        lastPaymentId: null,
        lastSyncedAt: Timestamp.fromDate(now),
    },
};

const FOUNDING_STATES = { 'founding-on': true, 'founding-off': false };

if (!STATES[state] && !(state in FOUNDING_STATES)) {
    console.error(`Unknown state "${state}". Valid: ${[...Object.keys(STATES), ...Object.keys(FOUNDING_STATES)].join(', ')}`);
    process.exit(1);
}

async function run() {
    const user = await auth.getUserByEmail(USER_EMAIL);
    console.log(`Found user: ${user.uid} (${USER_EMAIL})`);

    if (state in FOUNDING_STATES) {
        const val = FOUNDING_STATES[state];
        await db.collection('users').doc(user.uid).update({
            isFoundingMember: val,
            updatedAt: Timestamp.fromDate(now),
        });
        console.log(`✅ Set isFoundingMember → ${val} on ${USER_EMAIL}`);
    } else {
        await db.collection('users').doc(user.uid).update({
            subscription: STATES[state],
            updatedAt: Timestamp.fromDate(now),
        });
        console.log(`✅ Set subscription state → "${state}" on ${USER_EMAIL}`);
        console.log(JSON.stringify(STATES[state], (k, v) => v?.seconds ? new Date(v.seconds * 1000).toISOString() : v, 2));
    }
}

run().catch(e => { console.error(e); process.exit(1); });
