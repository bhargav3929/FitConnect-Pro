// Grant admin custom claim to a Firebase Auth user.
// Usage: node scripts/grant-admin.mjs <email>
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

const email = process.argv[2];
if (!email) {
    console.error('Usage: node scripts/grant-admin.mjs <email>');
    process.exit(1);
}

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
sa.private_key = sa.private_key.replace(/\\n/g, '\n');
if (!getApps().length) initializeApp({ credential: cert(sa) });

const auth = getAuth();
const u = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(u.uid, { admin: true });
console.log(`✓ admin claim set on ${email} (uid=${u.uid})`);
console.log('  → user must sign out and sign back in for the new token to take effect.');
