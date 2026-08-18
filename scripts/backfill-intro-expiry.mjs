/**
 * Extends subscription validity for existing Demo Class and Sol Intro Program buyers
 * after the PLAN_CATALOG durationDays increase (drop_in 30->60, kickstarter 14->45).
 *
 * Plan values are copied onto each user document at purchase time, so changing the
 * catalog only affects future purchases. This script recomputes endDate from the
 * original startDate using the new duration, and reactivates subscriptions that
 * expired only because the old window was too short.
 *
 * Usage:
 *   node scripts/backfill-intro-expiry.mjs            # dry run, prints the plan
 *   node scripts/backfill-intro-expiry.mjs --apply    # writes the changes
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

const env = {};
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
});

let saRaw = env.FIREBASE_SERVICE_ACCOUNT;
if (saRaw.startsWith('"') && saRaw.endsWith('"')) saRaw = saRaw.slice(1, -1);
saRaw = saRaw.replace(/\\"/g, '"');
const serviceAccount = JSON.parse(saRaw);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const APPLY = process.argv.includes('--apply');

// New catalog values, mirrored from shared/src/types/subscription.ts
const NEW_DURATION_DAYS = {
    drop_in: 60,
    kickstarter: 45,
};
const NEW_ADVANCE_BOOKING_DAYS = {
    kickstarter: 45,
};

// Legacy plan ids that resolve to one of the affected plans
const LEGACY_PLAN_MAP = {
    once_weekly: 'kickstarter',
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(val) {
    if (!val) return null;
    if (val instanceof Timestamp) return val.toDate();
    if (val.toDate) return val.toDate();
    if (val instanceof Date) return val;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
}

function fmt(d) {
    return d ? d.toISOString().slice(0, 10) : '--';
}

async function main() {
    const snapshot = await db.collection('users').get();
    const now = new Date();

    const changes = [];
    const skipped = [];

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const sub = data.subscription;
        if (!sub) continue;

        const rawPlanId = sub.planId || sub.planType;
        if (typeof rawPlanId !== 'string') continue;
        const planId = LEGACY_PLAN_MAP[rawPlanId] ?? rawPlanId;

        const newDuration = NEW_DURATION_DAYS[planId];
        if (!newDuration) continue;

        // Only touch subscriptions the customer can still reasonably use.
        // 'canceled' is a deliberate customer/admin action - leave it alone.
        if (sub.status !== 'active' && sub.status !== 'expired') {
            skipped.push({ email: data.email, planId, reason: `status=${sub.status}` });
            continue;
        }

        const startDate = toDate(sub.startDate);
        if (!startDate) {
            skipped.push({ email: data.email, planId, reason: 'no startDate' });
            continue;
        }

        const oldEnd = toDate(sub.endDate);

        // Credits the customer paid for and has not spent. Demo Class draws on
        // introCreditRemaining; the intro program draws on classesRemaining.
        const unusedCredits = planId === 'drop_in'
            ? (sub.introCreditRemaining ?? 0)
            : (sub.classesRemaining === null ? Infinity : (sub.classesRemaining ?? 0));

        let newEnd;
        let reactivates = false;

        if (sub.status === 'expired') {
            // A longer window measured from a purchase months ago is still a window
            // in the past. Give people who still hold credits a usable one from today.
            if (unusedCredits <= 0) {
                skipped.push({ email: data.email, planId, reason: 'expired, no credits left' });
                continue;
            }
            newEnd = new Date(now.getTime() + newDuration * DAY_MS);
            reactivates = true;
        } else {
            newEnd = new Date(startDate.getTime() + newDuration * DAY_MS);
        }

        // Never shorten an existing window.
        if (oldEnd && newEnd <= oldEnd) {
            skipped.push({ email: data.email, planId, reason: 'already >= new window' });
            continue;
        }
        const newAdvance = NEW_ADVANCE_BOOKING_DAYS[planId];
        const bumpsAdvance =
            newAdvance !== undefined &&
            typeof sub.advanceBookingDays === 'number' &&
            sub.advanceBookingDays < newAdvance;

        changes.push({
            uid: doc.id,
            email: data.email || '(no email)',
            planId: rawPlanId,
            status: sub.status,
            startDate,
            oldEnd,
            newEnd,
            reactivates,
            bumpsAdvance,
            oldAdvance: sub.advanceBookingDays,
            newAdvance,
            creditsRemaining: sub.classesRemaining,
            introCreditRemaining: sub.introCreditRemaining,
        });
    }

    console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} - intro/demo expiry backfill`);
    console.log(`Scanned ${snapshot.size} users, ${changes.length} to update, ${skipped.length} skipped.\n`);

    for (const c of changes) {
        const credits = c.planId === 'drop_in'
            ? `demo credits ${c.introCreditRemaining ?? 0}`
            : `credits ${c.creditsRemaining ?? 0}`;
        console.log(
            `  ${c.email.padEnd(34)} ${c.planId.padEnd(13)} ${c.status.padEnd(8)} ` +
            `${fmt(c.oldEnd)} -> ${fmt(c.newEnd)}  (${credits})` +
            `${c.reactivates ? '  [REACTIVATE]' : ''}` +
            `${c.bumpsAdvance ? `  [advance ${c.oldAdvance}->${c.newAdvance}]` : ''}`
        );
    }

    if (skipped.length) {
        console.log('\nSkipped:');
        for (const s of skipped) {
            console.log(`  ${(s.email || '(no email)').padEnd(34)} ${s.planId.padEnd(13)} ${s.reason}`);
        }
    }

    if (!APPLY) {
        console.log('\nNo writes performed. Re-run with --apply to commit these changes.\n');
        return;
    }

    let written = 0;
    for (const c of changes) {
        const update = {
            'subscription.endDate': Timestamp.fromDate(c.newEnd),
            updatedAt: Timestamp.fromDate(new Date()),
        };
        if (c.reactivates) update['subscription.status'] = 'active';
        if (c.bumpsAdvance) update['subscription.advanceBookingDays'] = c.newAdvance;

        await db.collection('users').doc(c.uid).update(update);
        written++;
    }

    console.log(`\nDone. Updated ${written} user${written === 1 ? '' : 's'}.\n`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
