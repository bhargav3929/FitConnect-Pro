// Provision a Google Play review account for the SOL Pilates mobile app.
//
// Creates (or updates) a Firebase Auth email/password user and writes a
// users/{uid} Firestore document with an ACTIVE membership so the Play
// reviewer can reach every booking/subscription screen without paying.
//
// Usage (point at the fitness-booking-c8fb3 service-account JSON):
//   node scripts/create-play-reviewer.mjs --sa ./fitness-booking-c8fb3-firebase-adminsdk-fbsvc-97034a0080.json
//
// Optional flags:
//   --email <addr>       default: playreview@solpilatesstudio.in
//   --password <pw>      default: a strong generated password (printed at end)
//   --name <name>        default: "Play Reviewer"
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
function flag(name, fallback) {
    const i = args.indexOf(`--${name}`);
    return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const saPath = flag('sa', process.env.FIREBASE_SERVICE_ACCOUNT_FILE);
if (!saPath) {
    console.error('ERROR: pass --sa /path/to/fitness-booking-c8fb3-service-account.json');
    process.exit(1);
}
const email = flag('email', 'playreview@solpilatesstudio.in');
const name = flag('name', 'Play Reviewer');
// Strong default password (no ambiguous chars, satisfies Firebase >= 6 chars).
const password = flag('password', 'SolPlay#Review2026!');

const sa = JSON.parse(readFileSync(resolve(saPath), 'utf8'));
if (sa.project_id !== 'fitness-booking-c8fb3') {
    console.error(`ERROR: service account is for project "${sa.project_id}", expected "fitness-booking-c8fb3".`);
    console.error('The mobile app authenticates against fitness-booking-c8fb3 — a reviewer account in any other project will not work.');
    process.exit(1);
}

if (!getApps().length) initializeApp({ credential: cert(sa) });
const auth = getAuth();
const db = getFirestore();

// 6-month 3x/week membership (the most generous tier), starting now.
const now = new Date();
const endDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

const subscription = {
    planId: 'thrice_6mo',
    planCategory: 'membership',
    startDate: Timestamp.fromDate(now),
    endDate: Timestamp.fromDate(endDate),
    status: 'active',
    classesRemaining: 72,
    introCreditRemaining: 0,
    maxClassesPerDay: 1,
    weeklyClassLimit: 3,
    advanceBookingDays: 14,
    guestPassesRemaining: 2,
    lastPaymentId: 'play-review-comp',
    autoRenew: false,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    razorpaySubscriptionId: null,
    razorpayPlanId: null,
    pendingPlanId: null,
    pendingRazorpayPlanId: null,
    pendingPlanEffectiveAt: null,
    lastSyncedAt: Timestamp.fromDate(now),
    kickstarterCreditsCarriedForward: false,
    carriedForwardCredits: 0,
};

async function main() {
    // 1. Create or update the Auth user.
    let user;
    try {
        user = await auth.getUserByEmail(email);
        await auth.updateUser(user.uid, { password, emailVerified: true, displayName: name });
        console.log(`Updated existing Auth user ${email} (uid ${user.uid}).`);
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            user = await auth.createUser({ email, password, emailVerified: true, displayName: name });
            console.log(`Created Auth user ${email} (uid ${user.uid}).`);
        } else {
            throw e;
        }
    }

    // 2. Write the Firestore profile with an active membership (merge — never clobber other fields).
    await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        id: user.uid,
        name,
        email,
        age: 0,
        fitnessGoals: [],
        profilePictureUrl: null,
        isFoundingMember: false,
        subscription,
        stats: { totalClassesAttended: 0, currentStreak: 0, longestStreak: 0 },
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
    }, { merge: true });

    console.log('\n=== Play Console "Sign in details" ===');
    console.log(`Username / email : ${email}`);
    console.log(`Password         : ${password}`);
    console.log(`Membership       : thrice_6mo (active, expires ${endDate.toISOString().slice(0, 10)})`);
    console.log('\nDone.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
