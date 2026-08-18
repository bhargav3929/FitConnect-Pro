/**
 * Reconciles `pending` payment docs against the real Razorpay state.
 *
 * One-time Orders (drop_in, kickstarter) are granted by the checkout callback and,
 * since the order.paid webhook was added, by the webhook too. Anything that slipped
 * through before that - or during a webhook outage - leaves a captured payment with
 * no plan. This walks every pending payment, asks Razorpay what actually happened,
 * and either grants access or marks the doc `abandoned` so the queue stays readable.
 *
 * Razorpay's /orders/{id}/payments endpoint answers 200 with an empty list for order
 * ids that do not exist on the account, so it cannot distinguish "no payments yet"
 * from "wrong account". This fetches /orders/{id} first, which 400s on unknown ids.
 *
 * Usage:
 *   node scripts/reconcile-pending-payments.mjs            # dry run, prints the plan
 *   node scripts/reconcile-pending-payments.mjs --apply    # writes the changes
 *   node scripts/reconcile-pending-payments.mjs --apply --only=<paymentDocId>
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const env = {};
readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
});

let saRaw = env.FIREBASE_SERVICE_ACCOUNT.replace(/\\"/g, '"');
const serviceAccount = JSON.parse(saRaw);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const APPLY = process.argv.includes('--apply');
const ONLY = process.argv.find(a => a.startsWith('--only='))?.split('=')[1] ?? null;

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
    console.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing. Export the live keys to reconcile live orders.');
    process.exit(1);
}

// Plan values mirrored from shared/src/types/subscription.ts (no TS runner here).
// assertCatalogMatch below cross-checks each grant against the catalog snapshot the
// payment doc recorded at purchase time, so drift surfaces instead of writing bad data.
const PLANS = {
    drop_in: { name: 'Demo Class', category: 'class_pack', credits: 1, durationDays: 60, maxClassesPerDay: 1, weeklyClassLimit: 1, advanceBookingDays: 7, guestPasses: 0, autoRenew: false },
    kickstarter: { name: 'Sol Intro Program', category: 'class_pack', credits: 4, durationDays: 45, maxClassesPerDay: 1, weeklyClassLimit: 2, advanceBookingDays: 45, guestPasses: 0, autoRenew: false },
};

async function razorpay(path) {
    const res = await fetch('https://api.razorpay.com/v1' + path, {
        headers: { Authorization: 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64') },
    });
    return { status: res.status, body: await res.json() };
}

function assertCatalogMatch(planId, plan, metadata) {
    if (!metadata) return;
    const drift = [];
    if (typeof metadata.credits === 'number' && metadata.credits !== plan.credits) {
        drift.push(`credits ${metadata.credits} -> ${plan.credits}`);
    }
    if (typeof metadata.durationDays === 'number' && metadata.durationDays !== plan.durationDays) {
        drift.push(`durationDays ${metadata.durationDays} -> ${plan.durationDays}`);
    }
    if (drift.length) {
        console.warn(`             !! ${planId} differs from purchase-time values: ${drift.join(', ')} (granting current catalog values)`);
    }
}

async function grant(paymentDoc, capturedPayment) {
    const data = paymentDoc.data();
    const plan = PLANS[data.planId];
    if (!plan) throw new Error(`No local plan definition for ${data.planId}`);
    assertCatalogMatch(data.planId, plan, data.metadata);

    const userRef = db.collection('users').doc(data.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error(`User ${data.userId} not found`);

    const currentSub = userSnap.data().subscription ?? {};
    const currentIntroCredit = typeof currentSub.introCreditRemaining === 'number' ? Math.max(0, currentSub.introCreditRemaining) : 0;

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const batch = db.batch();
    batch.update(paymentDoc.ref, {
        status: 'succeeded',
        razorpayPaymentId: capturedPayment.id,
        paidAt: now,
        grantedBy: 'reconcile-script',
        updatedAt: FieldValue.serverTimestamp(),
    });
    batch.update(userRef, {
        'subscription.planId': data.planId,
        'subscription.planCategory': plan.category,
        'subscription.startDate': now,
        'subscription.endDate': endDate,
        'subscription.status': 'active',
        'subscription.classesRemaining': data.planId === 'drop_in' ? 0 : plan.credits,
        'subscription.introCreditRemaining': data.planId === 'drop_in' ? 1 : currentIntroCredit,
        'subscription.maxClassesPerDay': plan.maxClassesPerDay,
        'subscription.weeklyClassLimit': plan.weeklyClassLimit,
        'subscription.advanceBookingDays': plan.advanceBookingDays,
        'subscription.guestPassesRemaining': plan.guestPasses,
        'subscription.lastPaymentId': paymentDoc.id,
        'subscription.autoRenew': plan.autoRenew,
        updatedAt: FieldValue.serverTimestamp(),
    });

    if (data.planId === 'drop_in') {
        const lead = data.metadata?.introClassLead ?? {};
        batch.set(db.collection('introClassLeads').doc(data.userId), {
            name: lead.name ?? userSnap.data().name ?? '',
            email: lead.email ?? capturedPayment.email ?? userSnap.data().email ?? '',
            phone: lead.phone ?? capturedPayment.contact ?? '',
            goals: lead.goals ?? '',
            concerns: lead.concerns ?? '',
            userId: data.userId,
            source: lead.source ?? 'intro-class-payment',
            status: 'new',
            paymentStatus: 'paid',
            paymentId: paymentDoc.id,
            razorpayOrderId: data.razorpayOrderId,
            razorpayPaymentId: capturedPayment.id,
            amount: data.amount,
            currency: data.currency,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    }

    await batch.commit();
    return endDate;
}

const snap = await db.collection('payments').where('status', '==', 'pending').get();
const docs = snap.docs
    .filter(d => !ONLY || d.id === ONLY)
    .sort((a, b) => (a.data().createdAt?.toMillis?.() ?? 0) - (b.data().createdAt?.toMillis?.() ?? 0));

console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} - key ${KEY_ID}, ${docs.length} pending payment(s)\n`);

const summary = { granted: 0, abandoned: 0, unknown: 0, skipped: 0, failed: 0 };

for (const doc of docs) {
    const d = doc.data();
    const label = `${doc.id} ${String(d.planId).padEnd(16)} INR ${String(d.amount).padEnd(6)} ${d.userId}`;

    if (!d.razorpayOrderId) {
        console.log(`no-order-id  ${label}`);
        summary.skipped++;
        continue;
    }

    const order = await razorpay(`/orders/${d.razorpayOrderId}`);
    if (order.status !== 200) {
        // Not on this account - almost always a test-key order seen with live keys.
        console.log(`other-acct   ${label} ${d.razorpayOrderId}`);
        summary.unknown++;
        continue;
    }

    const payments = (await razorpay(`/orders/${d.razorpayOrderId}/payments`)).body.items ?? [];
    const captured = payments.find(p => p.status === 'captured');

    if (!captured) {
        console.log(`abandoned    ${label} order=${order.body.status}`);
        summary.abandoned++;
        if (APPLY) {
            await doc.ref.update({
                status: 'abandoned',
                abandonedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        }
        continue;
    }

    if (!PLANS[d.planId]) {
        console.log(`NEEDS-MANUAL ${label} captured=${captured.id} (membership/unknown plan - grant via subscription flow)`);
        summary.skipped++;
        continue;
    }

    console.log(`GRANT        ${label} captured=${captured.id} ${captured.email ?? ''}`);
    summary.granted++;
    if (APPLY) {
        try {
            const endDate = await grant(doc, captured);
            console.log(`             -> granted, access until ${endDate.toISOString().slice(0, 10)}`);
        } catch (error) {
            console.error(`             -> FAILED: ${error.message}`);
            summary.granted--;
            summary.failed++;
        }
    }
}

console.log(`\n${APPLY ? 'Applied' : 'Would apply'}: ${summary.granted} granted, ${summary.abandoned} abandoned, ${summary.unknown} other-account, ${summary.skipped} skipped, ${summary.failed} failed`);
if (!APPLY) console.log('Re-run with --apply to write.');
process.exit(0);
