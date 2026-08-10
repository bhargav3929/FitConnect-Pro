#!/usr/bin/env node
// Normalise classes.date to a Timestamp at UTC midnight.
//
// Firestore orders Timestamps before strings, so a class whose `date` is a
// 'YYYY-MM-DD' string can never satisfy the schedule's `date >= <Timestamp>`
// range filter — the class is invisible in the app on every device, forever.
//
// Usage:
//   node scripts/migrate-class-date-timestamps.mjs            # dry-run
//   node scripts/migrate-class-date-timestamps.mjs --execute  # writes updates

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

// A day-only string means UTC midnight, matching what createClass writes.
function toTimestamp(raw) {
    if (typeof raw === 'string') {
        const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw.trim());
        const parsed = new Date(dayOnly ? `${raw.trim()}T00:00:00.000Z` : raw);
        return Number.isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed);
    }
    if (typeof raw === 'number') {
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed);
    }
    return null;
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
const snap = await db.collection('classes').get();

console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY-RUN'}`);
console.log(`Project: ${serviceAccount.project_id}`);
console.log(`Scanned ${snap.size} class documents.\n`);

const fixable = [];
const unfixable = [];
for (const doc of snap.docs) {
    const raw = doc.data().date;
    if (raw instanceof Timestamp) continue;
    const next = toTimestamp(raw);
    if (next) fixable.push({ doc, from: raw, to: next });
    else unfixable.push({ id: doc.id, raw });
}

if (fixable.length === 0 && unfixable.length === 0) {
    console.log('Every class already stores date as a Timestamp. Nothing to do.');
    process.exit(0);
}

for (const { doc, from, to } of fixable) {
    console.log(`  ${doc.id}: ${JSON.stringify(from)} -> ${to.toDate().toISOString()}`);
}
for (const { id, raw } of unfixable) {
    console.log(`  ${id}: UNPARSEABLE date ${JSON.stringify(raw)} — needs a manual decision`);
}
console.log('');

if (!execute) {
    console.log(`[DRY RUN] ${fixable.length} document(s) would be updated. Pass --execute to write.`);
    process.exit(0);
}

let batch = db.batch();
let pending = 0;
for (const { doc, to } of fixable) {
    batch.update(doc.ref, { date: to });
    pending++;
    if (pending === 400) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
    }
}
if (pending > 0) await batch.commit();

console.log(`Updated ${fixable.length} document(s).`);
if (unfixable.length > 0) {
    console.log(`${unfixable.length} document(s) left untouched — see UNPARSEABLE above.`);
}
process.exit(0);
