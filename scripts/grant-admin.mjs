// Grant admin custom claim to a Firebase Auth user.
//
// Dev (default — reads FIREBASE_SERVICE_ACCOUNT from .env.local):
//   node scripts/grant-admin.mjs <email>
//
// Prod (one-off bootstrap — point at the prod service-account JSON):
//   node scripts/grant-admin.mjs <email> --sa /path/to/prod-service-account.json
//   FIREBASE_SERVICE_ACCOUNT_FILE=/path/to/prod-sa.json node scripts/grant-admin.mjs <email>
//
// The prod project starts with zero admins; run this once to grant the first one.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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
        if (!(k in process.env)) process.env[k] = v;
    }
}
loadEnv();

const args = process.argv.slice(2);
const saFlagIdx = args.indexOf('--sa');
const saPath = saFlagIdx !== -1 ? args[saFlagIdx + 1] : process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
const email = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--sa');

if (!email) {
    console.error('Usage: node scripts/grant-admin.mjs <email> [--sa /path/to/service-account.json]');
    process.exit(1);
}

// Prefer an explicit service-account file (used for the prod project); otherwise
// fall back to the FIREBASE_SERVICE_ACCOUNT env (dev, from .env.local).
let sa;
if (saPath) {
    sa = JSON.parse(readFileSync(resolve(saPath), 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    console.error('No credentials: set FIREBASE_SERVICE_ACCOUNT (.env.local) or pass --sa <file>.');
    process.exit(1);
}
sa.private_key = sa.private_key.replace(/\\n/g, '\n');
if (!getApps().length) initializeApp({ credential: cert(sa) });

console.log(`Target project: ${sa.project_id}`);

const auth = getAuth();
const u = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(u.uid, { admin: true });
console.log(`✓ admin claim set on ${email} (uid=${u.uid})`);
console.log('  → user must sign out and sign back in for the new token to take effect.');
