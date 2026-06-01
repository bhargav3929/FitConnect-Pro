#!/usr/bin/env node
// Deploy Firestore composite indexes from firestore.indexes.json.
// Usage:
//   node scripts/deploy-firestore-indexes.mjs
//   node scripts/deploy-firestore-indexes.mjs --project fitness-booking-c8fb3

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function loadEnv() {
    for (const name of ['.env.local', '.env']) {
        const envPath = resolve(rootDir, name);
        if (!existsSync(envPath)) continue;

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
}

function getArgValue(name) {
    const index = process.argv.indexOf(name);
    if (index === -1) return undefined;
    return process.argv[index + 1];
}

loadEnv();

if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`Deploy Firestore composite indexes from firestore.indexes.json.

Usage:
  npm run deploy:firestore:indexes -- --project fitness-booking-c8fb3
  FIREBASE_PROJECT_ID=fitness-booking-c8fb3 npm run deploy:firestore:indexes

Options:
  --project <project-id>   Firebase project id to deploy indexes to
  -h, --help               Show this help message`);
    process.exit(0);
}

const project = getArgValue('--project') || process.env.FIREBASE_PROJECT_ID;
if (!project) {
    console.error('Missing Firebase project. Pass --project <project-id> or set FIREBASE_PROJECT_ID in .env.local/.env.');
    process.exit(1);
}

const indexesPath = resolve(rootDir, 'firestore.indexes.json');
if (!existsSync(indexesPath)) {
    console.error(`Missing ${indexesPath}`);
    process.exit(1);
}

JSON.parse(readFileSync(indexesPath, 'utf8'));

console.log(`Deploying Firestore indexes to project "${project}"...`);
const result = spawnSync(
    'npx',
    ['--yes', 'firebase-tools', 'deploy', '--only', 'firestore:indexes', '--project', project],
    {
        cwd: rootDir,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    },
);

process.exit(result.status ?? 1);
