#!/usr/bin/env node
// Deletes all upcoming classes (date >= today) and their bookings.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
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

const today = new Date();
today.setHours(0, 0, 0, 0);

const classesSnap = await db.collection('classes').where('date', '>=', today).get();
console.log(`Found ${classesSnap.size} upcoming classes`);

const classIds = classesSnap.docs.map(d => d.id);
let bookingsDeleted = 0;

for (const id of classIds) {
    const bks = await db.collection('bookings').where('classId', '==', id).get();
    for (const b of bks.docs) {
        await b.ref.delete();
        bookingsDeleted++;
    }
    await db.collection('classes').doc(id).delete();
    console.log(`  deleted classes/${id} (+${bks.size} bookings)`);
}

console.log(`\nDone. Deleted ${classIds.length} classes and ${bookingsDeleted} bookings.`);
