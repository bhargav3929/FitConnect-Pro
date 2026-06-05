#!/usr/bin/env node
// Backfill Firestore users created by Google sign-in or older auth flows.
// Usage:
//   node scripts/migrate-google-users.mjs            # dry-run
//   node scripts/migrate-google-users.mjs --execute  # writes updates

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const envPath = ['.env.local', '.env']
        .map((name) => resolve(__dirname, '..', name))
        .find((path) => existsSync(path));

    if (!envPath) return;

    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        let v = t.slice(eq + 1).trim();
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
            v = v.slice(1, -1);
        }
        if (!(k in process.env)) process.env[k] = v;
    }
}

function getDefaultSubscription(existing = {}) {
    return {
        planId: existing.planId ?? existing.planType ?? null,
        planType: existing.planType ?? null,
        planCategory: existing.planCategory ?? null,
        startDate: existing.startDate ?? null,
        endDate: existing.endDate ?? null,
        status: existing.status ?? 'expired',
        classesRemaining: existing.classesRemaining ?? 0,
        maxClassesPerDay: existing.maxClassesPerDay ?? 0,
        weeklyClassLimit: existing.weeklyClassLimit ?? 0,
        advanceBookingDays: existing.advanceBookingDays ?? 0,
        guestPassesRemaining: existing.guestPassesRemaining ?? 0,
        lastPaymentId: existing.lastPaymentId ?? null,
        autoRenew: existing.autoRenew ?? false,
        razorpaySubscriptionId: existing.razorpaySubscriptionId ?? null,
    };
}

function getDefaultStats(existing = {}) {
    return {
        totalClassesAttended: existing.totalClassesAttended ?? 0,
        currentStreak: existing.currentStreak ?? 0,
        longestStreak: existing.longestStreak ?? 0,
        lastAttendedDate: existing.lastAttendedDate ?? null,
    };
}

function buildPatch(uid, authUser, existing = {}) {
    const patch = {};
    const displayName = authUser.displayName || authUser.email || 'Member';

    if (!existing.uid) patch.uid = uid;
    if (!existing.email) patch.email = authUser.email || '';
    if (!existing.name) patch.name = displayName;
    if (existing.age === undefined) patch.age = 0;
    if (!existing.fitnessGoals) patch.fitnessGoals = [];
    if (existing.profilePictureUrl === undefined) patch.profilePictureUrl = authUser.photoURL || null;
    if (!existing.createdAt) patch.createdAt = FieldValue.serverTimestamp();
    patch.updatedAt = FieldValue.serverTimestamp();

    patch.subscription = getDefaultSubscription(existing.subscription || {});
    patch.stats = getDefaultStats(existing.stats || {});

    return patch;
}

async function listAllAuthUsers(auth) {
    const users = [];
    let pageToken;

    do {
        const page = await auth.listUsers(1000, pageToken);
        users.push(...page.users);
        pageToken = page.pageToken;
    } while (pageToken);

    return users;
}

loadEnv();

const execute = process.argv.includes('--execute');
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('Missing FIREBASE_SERVICE_ACCOUNT. Add it to .env.local or .env, or export it before running this script.');
    process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}

const auth = getAuth();
const db = getFirestore();
const authUsers = await listAllAuthUsers(auth);

console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY-RUN'}`);
console.log(`Found ${authUsers.length} Firebase Auth users.`);

let created = 0;
let patched = 0;
let unchanged = 0;

for (const authUser of authUsers) {
    const userRef = db.collection('users').doc(authUser.uid);
    const userDoc = await userRef.get();
    const existing = userDoc.exists ? userDoc.data() : undefined;
    const patch = buildPatch(authUser.uid, authUser, existing || {});

    const isNewDoc = !userDoc.exists;
    const needsPatch = isNewDoc || Object.keys(patch).some((key) => {
        if (key === 'updatedAt') return false;
        if (key === 'subscription') return JSON.stringify(patch.subscription) !== JSON.stringify(existing?.subscription || {});
        if (key === 'stats') return JSON.stringify(patch.stats) !== JSON.stringify(existing?.stats || {});
        return existing?.[key] === undefined || existing?.[key] === null || existing?.[key] === '';
    });

    if (!needsPatch) {
        unchanged += 1;
        continue;
    }

    console.log(`${execute ? 'Writing' : 'Would write'} users/${authUser.uid}: ${isNewDoc ? 'create missing profile' : 'patch missing profile fields'}`);

    if (execute) {
        await userRef.set(patch, { merge: true });
    }

    if (isNewDoc) created += 1;
    else patched += 1;
}

console.log(`${execute ? 'Created' : 'Would create'} ${created} missing user documents.`);
console.log(`${execute ? 'Patched' : 'Would patch'} ${patched} existing user documents.`);
console.log(`Unchanged ${unchanged} user documents.`);
