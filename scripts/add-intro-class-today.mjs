#!/usr/bin/env node
// Adds one "Demo Class" to today's schedule at 11:00 AM.
// Usage:
//   node scripts/add-intro-class-today.mjs            # dry-run
//   node scripts/add-intro-class-today.mjs --execute  # writes to Firestore

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const envPath = resolve(__dirname, '..', '.env.local');
    const raw = readFileSync(envPath, 'utf8');
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
}
loadEnv();

const execute = process.argv.includes('--execute');

const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const cleaned = raw.replace(/\\\n/g, '\\n');
const sa = JSON.parse(cleaned);
if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');

if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();

// Build today's 11:00 AM timestamp
const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);
const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30, 0);

const docId = `cls-demo-today-1100`;

const data = {
    title: 'Demo Class',
    classType: 'Demo Class',
    description: 'Your first step into the SOL method. A welcoming, low-intensity session designed for new members.',
    startTime: '11:00',
    startTimestamp: Timestamp.fromDate(start),
    endTimestamp: Timestamp.fromDate(end),
    date: start.toISOString().slice(0, 10),
    capacity: 10,
    bookedSpots: [],
    waitlist: [],
    status: 'scheduled',
    intensityLevel: 1,
    location: 'Yoga Studio',
    trainerId: null,
    trainerName: 'SOL Team',
    durationMinutes: 30,
    requiresIntroPack: true,
};

console.log('\nDoc ID :', docId);
console.log('Date   :', data.date);
console.log('Time   :', data.startTime);
console.log('Type   :', data.classType);
console.log('Status :', data.status);

if (!execute) {
    console.log('\n[DRY RUN] Pass --execute to write to Firestore.\n');
    process.exit(0);
}

await db.collection('classes').doc(docId).set(data, { merge: true });
console.log(`\n✅ Written to classes/${docId}\n`);
