#!/usr/bin/env node
// Usage:
//   node scripts/delete-user.mjs <email>            # dry-run, shows what would be deleted
//   node scripts/delete-user.mjs <email> --execute  # actually deletes
//
// Deletes: Firebase Auth user + Firestore `users/{uid}` + all `bookings` where userId == uid.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dep)
function loadEnv() {
    const envPath = resolve(__dirname, '..', '.env.local');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
            val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
    }
}
loadEnv();

const [, , email, flag] = process.argv;
if (!email) {
    console.error('Usage: node scripts/delete-user.mjs <email> [--execute]');
    process.exit(1);
}
const execute = flag === '--execute';

let serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

console.log(`\n  Target: ${email}`);
console.log(`  Mode:   ${execute ? 'EXECUTE (destructive)' : 'DRY-RUN'}\n`);

// 1. Auth lookup
let authUser = null;
try {
    authUser = await auth.getUserByEmail(email);
    console.log(`  [auth]      uid=${authUser.uid} disabled=${authUser.disabled} created=${authUser.metadata.creationTime}`);
} catch (e) {
    if (e.code === 'auth/user-not-found') {
        console.log('  [auth]      no auth record');
    } else {
        console.error('  [auth]      error:', e.message);
        process.exit(1);
    }
}

// 2. Firestore user doc — try by uid first, then scan by email
let userDocRef = null;
let userDocData = null;
if (authUser) {
    const snap = await db.collection('users').doc(authUser.uid).get();
    if (snap.exists) {
        userDocRef = snap.ref;
        userDocData = snap.data();
    }
}
if (!userDocRef) {
    const q = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!q.empty) {
        userDocRef = q.docs[0].ref;
        userDocData = q.docs[0].data();
    }
}
console.log(
    userDocRef
        ? `  [users]     ${userDocRef.path} name="${userDocData?.name ?? ''}" credits=${userDocData?.subscription?.classesRemaining ?? '-'}`
        : '  [users]     no Firestore user doc',
);

// 3. Bookings
const uid = authUser?.uid ?? userDocRef?.id;
let bookingsSnap = { docs: [] };
if (uid) {
    bookingsSnap = await db.collection('bookings').where('userId', '==', uid).get();
    console.log(`  [bookings]  ${bookingsSnap.docs.length} booking(s) for userId=${uid}`);
    for (const b of bookingsSnap.docs) {
        const d = b.data();
        console.log(`              - ${b.id} status=${d.status} spot=${d.spotNumber} classId=${d.classId}`);
    }
}

if (!execute) {
    console.log('\n  Dry-run complete. Re-run with --execute to actually delete.\n');
    process.exit(0);
}

// EXECUTE
console.log('\n  Deleting...');
if (bookingsSnap.docs.length) {
    const batch = db.batch();
    for (const b of bookingsSnap.docs) batch.delete(b.ref);
    await batch.commit();
    console.log(`  [bookings]  deleted ${bookingsSnap.docs.length}`);
}
if (userDocRef) {
    await userDocRef.delete();
    console.log(`  [users]     deleted ${userDocRef.path}`);
}
if (authUser) {
    await auth.deleteUser(authUser.uid);
    console.log(`  [auth]      deleted uid=${authUser.uid}`);
}
console.log('\n  Done.\n');
