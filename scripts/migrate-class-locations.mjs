#!/usr/bin/env node
// Remap classes.location onto the two rooms the studio actually has.
// Usage:
//   node scripts/migrate-class-locations.mjs            # dry-run
//   node scripts/migrate-class-locations.mjs --execute  # writes updates

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

const GROUP_ROOM = 'Group Room';
const PRIVATE_ROOM = 'Private Room';

// Every retired room name maps onto one of the two real rooms. Anything that
// was a one-on-one space becomes the Private Room; the rest were group spaces.
const ROOM_MAP = new Map([
    ['private suite', PRIVATE_ROOM],
    ['private room', PRIVATE_ROOM],
    ['main studio', GROUP_ROOM],
    ['reformer studio', GROUP_ROOM],
    ['mat studio', GROUP_ROOM],
    ['barre & stretch', GROUP_ROOM],
    ['barre studio', GROUP_ROOM],
    ['recovery lounge', GROUP_ROOM],
    ['prenatal room', GROUP_ROOM],
    ['performance floor', GROUP_ROOM],
    ['wellness room', GROUP_ROOM],
    ['yoga studio', GROUP_ROOM],
    ['group room', GROUP_ROOM],
]);

// A class with a single spot is a one-on-one session regardless of the room
// name it was stored under.
function targetRoom(data) {
    const totalSpots = typeof data.totalSpots === 'number' ? data.totalSpots : undefined;
    if (totalSpots === 1) return PRIVATE_ROOM;

    const raw = typeof data.location === 'string' ? data.location.trim().toLowerCase() : '';
    return ROOM_MAP.get(raw) ?? GROUP_ROOM;
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

const before = new Map();
for (const doc of snap.docs) {
    const raw = doc.data().location;
    const key = typeof raw === 'string' && raw.trim() ? raw.trim() : '(unset)';
    before.set(key, (before.get(key) ?? 0) + 1);
}
console.log('Current locations:');
for (const [name, count] of [...before].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${name}`);
}
console.log('');

const changes = [];
for (const doc of snap.docs) {
    const data = doc.data();
    const next = targetRoom(data);
    if (data.location === next) continue;
    changes.push({ doc, from: data.location ?? '(unset)', to: next });
}

const moves = new Map();
for (const { from, to } of changes) {
    const key = `${from} -> ${to}`;
    moves.set(key, (moves.get(key) ?? 0) + 1);
}
console.log(`${changes.length} of ${snap.size} classes need remapping:`);
for (const [move, count] of [...moves].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${move}`);
}
console.log('');

if (!execute) {
    console.log('Dry-run only. Re-run with --execute to write these updates.');
    process.exit(0);
}

let written = 0;
for (let i = 0; i < changes.length; i += 400) {
    const batch = db.batch();
    for (const { doc, to } of changes.slice(i, i + 400)) {
        batch.update(doc.ref, { location: to, updatedAt: FieldValue.serverTimestamp() });
    }
    await batch.commit();
    written += Math.min(400, changes.length - i);
    console.log(`Committed ${written}/${changes.length}`);
}

console.log(`\nUpdated ${written} class documents.`);
