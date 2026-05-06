#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
}
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
sa.private_key = sa.private_key.replace(/\\n/g, '\n');
if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();
const auth = getAuth();

const today = new Date();
today.setHours(0, 0, 0, 0);

const alice = await auth.getUserByEmail('alice@test.com');
const snap = await db.collection('bookings').where('userId', '==', alice.uid).get();
const upcoming = snap.docs.filter(d => {
    const cd = d.data().classDate;
    const dt = cd?.toDate ? cd.toDate() : new Date(cd);
    return dt >= today;
});
console.log(`Found ${upcoming.length} upcoming Alice bookings (of ${snap.size} total)`);
for (const b of upcoming) {
    await b.ref.delete();
    console.log(`  deleted bookings/${b.id}`);
}
console.log('Done.');
