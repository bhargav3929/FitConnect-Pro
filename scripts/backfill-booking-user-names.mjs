#!/usr/bin/env node
// Backfill bookings.userName from users/{userId}.
// Usage:
//   node scripts/backfill-booking-user-names.mjs            # dry-run
//   node scripts/backfill-booking-user-names.mjs --execute  # writes updates

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
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

function getUserName(data, fallback) {
    if (typeof data?.displayName === 'string' && data.displayName.trim()) {
        return data.displayName.trim();
    }
    if (typeof data?.name === 'string' && data.name.trim()) {
        return data.name.trim();
    }
    if (typeof data?.email === 'string' && data.email.trim()) {
        return data.email.trim();
    }
    return fallback;
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

const db = getFirestore();
const bookingsSnap = await db.collection('bookings').get();
const bookings = bookingsSnap.docs.filter((doc) => {
    const data = doc.data();
    return data.userId && !(typeof data.userName === 'string' && data.userName.trim());
});

const userIds = Array.from(new Set(bookings.map((doc) => doc.data().userId)));
const usersById = new Map();

await Promise.all(userIds.map(async (userId) => {
    const userSnap = await db.collection('users').doc(userId).get();
    usersById.set(userId, userSnap.exists ? userSnap.data() : undefined);
}));

console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY-RUN'}`);
console.log(`Found ${bookings.length} bookings missing userName.`);

let updated = 0;
for (const bookingDoc of bookings) {
    const booking = bookingDoc.data();
    const userName = getUserName(usersById.get(booking.userId), booking.userId);

    console.log(`${execute ? 'Updating' : 'Would update'} bookings/${bookingDoc.id}: userName="${userName}"`);

    if (execute) {
        await bookingDoc.ref.update({
            userName,
            updatedAt: FieldValue.serverTimestamp(),
        });
    }
    updated += 1;
}

console.log(`${execute ? 'Updated' : 'Would update'} ${updated} booking documents.`);
