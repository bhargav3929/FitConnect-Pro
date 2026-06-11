// Clears the Firestore pricing cache so the next pricing API call re-syncs
// from Razorpay (or falls back to the updated PLAN_CATALOG static prices).
//
// Run with: node scripts/bust-pricing-cache.mjs
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
            v = v.slice(1, -1);
        }
        process.env[k] = v;
    }
}

loadEnv();

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.error('FIREBASE_SERVICE_ACCOUNT not set'); process.exit(1); }
const sa = JSON.parse(raw);
sa.private_key = sa.private_key.replace(/\\n/g, '\n');

if (!getApps().length) {
    initializeApp({ credential: cert(sa) });
}

const db = getFirestore();

await db.collection('settings').doc('razorpayPlans').delete();
console.log('Pricing cache cleared. Next pricing API call will re-sync.');
