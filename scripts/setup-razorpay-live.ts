/**
 * Provision the LIVE Razorpay account for Sol Pilates — idempotently.
 *
 * What it sets up:
 *   1. Membership subscription Plans (one per recurring tier) — standard prices.
 *   2. Founding-member Plan variants (notes.fitconnect_variant=founding).
 *   3. The billing Webhook: production URL + the exact event set the handler
 *      in src/app/api/webhooks/razorpay/route.ts listens for + signing secret.
 *
 * Demo Class and Sol Intro stay one-time Razorpay Orders (created per-purchase),
 * so they are intentionally NOT provisioned here.
 *
 * Safe by default:
 *   - DRY RUN unless you pass --apply. A dry run only READS the account.
 *   - Idempotent: existing Plans/webhook are detected by notes / URL and reused,
 *     never duplicated. Re-running is safe.
 *   - Refuses to target an rzp_test_ key unless you pass --allow-test.
 *
 * Usage:
 *   npx tsx scripts/setup-razorpay-live.ts                 # dry run (read-only)
 *   npx tsx scripts/setup-razorpay-live.ts --apply         # create/update for real
 *
 * Flags:
 *   --apply                 perform writes (default: dry run)
 *   --url=<webhookUrl>      override webhook URL (default below)
 *   --alert-email=<email>   webhook alert email (optional)
 *   --allow-test            permit running against an rzp_test_ key
 *   --generate-secret       mint a webhook secret if none is in the environment
 *   --skip-plans            only do the webhook
 *   --skip-webhook          only do the plans
 *
 * Credentials — first found wins, read from process.env then .env.local:
 *   RAZORPAY_LIVE_KEY_ID        || RAZORPAY_KEY_ID
 *   RAZORPAY_LIVE_KEY_SECRET    || RAZORPAY_KEY_SECRET
 *   RAZORPAY_LIVE_WEBHOOK_SECRET|| RAZORPAY_WEBHOOK_SECRET   (must match the value
 *                                  the deployed app uses to verify signatures)
 *
 * Prereq: Subscriptions must be enabled on the live account
 *   (Razorpay Dashboard -> Subscriptions -> Activate).
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { PLAN_CATALOG, type PlanId } from '../shared/src/types/subscription';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_WEBHOOK_URL = 'https://www.solpilatesstudio.in/api/webhooks/razorpay';

/** Exactly the events handled in src/app/api/webhooks/razorpay/route.ts. */
const WEBHOOK_EVENTS = [
    'subscription.activated',
    'subscription.charged',
    'invoice.paid',
    'subscription.updated',
    'subscription.halted',
    'subscription.cancelled',
    'subscription.completed',
    'payment.failed',
] as const;

// ---------------------------------------------------------------------------
// Env loading (process.env wins; .env.local is the fallback)
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

let envFile = '';
try {
    envFile = readFileSync(resolve(root, '.env.local'), 'utf8');
} catch {
    // .env.local is optional when everything is supplied via process.env
}

function env(key: string): string {
    const fromProcess = process.env[key];
    if (fromProcess && fromProcess.trim()) return fromProcess.trim();
    const match = envFile.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match?.[1]?.replace(/^['"]|['"]$/g, '').trim() ?? '';
}

const KEY_ID = env('RAZORPAY_LIVE_KEY_ID') || env('RAZORPAY_KEY_ID');
const KEY_SECRET = env('RAZORPAY_LIVE_KEY_SECRET') || env('RAZORPAY_KEY_SECRET');
let WEBHOOK_SECRET = env('RAZORPAY_LIVE_WEBHOOK_SECRET') || env('RAZORPAY_WEBHOOK_SECRET');

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const valueOf = (name: string) =>
    args.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1);

const APPLY = has('--apply');
const ALLOW_TEST = has('--allow-test');
const GENERATE_SECRET = has('--generate-secret');
const SKIP_PLANS = has('--skip-plans');
const SKIP_WEBHOOK = has('--skip-webhook');
const WEBHOOK_URL = valueOf('--url') ?? DEFAULT_WEBHOOK_URL;
const ALERT_EMAIL = valueOf('--alert-email');

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

if (!KEY_ID || !KEY_SECRET) {
    console.error(
        'Missing Razorpay credentials.\n' +
        'Set RAZORPAY_LIVE_KEY_ID + RAZORPAY_LIVE_KEY_SECRET (preferred) or ' +
        'RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env.local or the environment.',
    );
    process.exit(1);
}

const isTestKey = KEY_ID.startsWith('rzp_test');
if (isTestKey && !ALLOW_TEST) {
    console.error(
        `Refusing to run: ${KEY_ID} is a TEST key but this script targets the LIVE account.\n` +
        'Provide live credentials (RAZORPAY_LIVE_KEY_ID / RAZORPAY_LIVE_KEY_SECRET), ' +
        'or pass --allow-test to run against the test account on purpose.',
    );
    process.exit(1);
}

const rzp = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET }) as unknown as RazorpayClient;

// ---------------------------------------------------------------------------
// Minimal SDK shapes (the package ships loose types)
// ---------------------------------------------------------------------------

interface RzpPlan {
    id: string;
    period: string;
    interval: number;
    item: { name: string; amount: number; currency: string };
    notes?: Record<string, string>;
}
interface RzpWebhook {
    id: string;
    url: string;
    active?: boolean;
    events: string[] | Record<string, boolean>;
}
interface RazorpayClient {
    plans: {
        all(opts?: { count?: number; skip?: number }): Promise<{ items: RzpPlan[]; count: number }>;
        create(params: Record<string, unknown>): Promise<RzpPlan>;
    };
}

/**
 * Calls the Razorpay REST API directly with a JSON body. The node SDK form-encodes
 * request bodies, which corrupts array params like the webhook `events` list
 * (Razorpay then reports "Invalid event name/names: 1, 2, 3..."). JSON avoids that
 * and matches Razorpay's documented webhook format.
 */
async function razorpayFetch(method: string, path: string, body?: unknown): Promise<unknown> {
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
        method,
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: { description?: string; reason?: string } };
    if (!res.ok) {
        throw new Error(data?.error?.description || data?.error?.reason || `HTTP ${res.status}`);
    }
    return data;
}

// ---------------------------------------------------------------------------
// Desired plan set — derived from PLAN_CATALOG (single source of truth)
// ---------------------------------------------------------------------------

type Variant = 'standard' | 'founding';

interface DesiredPlan {
    planId: PlanId;
    variant: Variant;
    label: string;
    name: string;
    amountRupees: number;
    period: 'monthly';
    interval: number;
    totalCount: number;
    notes: Record<string, string>;
}

function buildDesiredPlans(): DesiredPlan[] {
    const out: DesiredPlan[] = [];
    for (const plan of PLAN_CATALOG) {
        if (plan.category !== 'membership') continue;
        const interval = plan.razorpayInterval ?? (plan.durationDays >= 180 ? 6 : 3);
        const totalCount = plan.razorpayTotalCount ?? 24;

        out.push({
            planId: plan.id,
            variant: 'standard',
            label: plan.id,
            name: plan.name,
            amountRupees: plan.price,
            period: 'monthly',
            interval,
            totalCount,
            notes: { fitconnect_plan_id: plan.id },
        });

        if (typeof plan.foundingPrice === 'number') {
            out.push({
                planId: plan.id,
                variant: 'founding',
                label: `${plan.id} (founding)`,
                name: `${plan.name} - Founding`,
                amountRupees: plan.foundingPrice,
                period: 'monthly',
                interval,
                totalCount,
                notes: { fitconnect_plan_id: plan.id, fitconnect_variant: 'founding' },
            });
        }
    }
    return out;
}

function isFounding(plan: RzpPlan): boolean {
    return plan.notes?.fitconnect_variant?.toLowerCase() === 'founding';
}

// ---------------------------------------------------------------------------
// Plans provisioning
// ---------------------------------------------------------------------------

async function fetchAllPlans(): Promise<RzpPlan[]> {
    const items: RzpPlan[] = [];
    let skip = 0;
    for (;;) {
        const res = await rzp.plans.all({ count: 100, skip });
        items.push(...res.items);
        if (res.items.length < 100) break;
        skip += 100;
    }
    return items;
}

interface PlanResult {
    desired: DesiredPlan;
    status: 'exists' | 'created' | 'mismatch' | 'would-create' | 'error';
    razorpayPlanId: string | null;
    note?: string;
}

async function provisionPlans(): Promise<PlanResult[]> {
    const desired = buildDesiredPlans();
    const existing = await fetchAllPlans();
    const results: PlanResult[] = [];

    for (const want of desired) {
        const wantVariantFounding = want.variant === 'founding';
        const candidates = existing.filter(
            (p) => p.notes?.fitconnect_plan_id === want.planId && isFounding(p) === wantVariantFounding,
        );

        const exact = candidates.find(
            (p) =>
                p.item.amount === want.amountRupees * 100 &&
                p.period === want.period &&
                p.interval === want.interval,
        );

        if (exact) {
            results.push({ desired: want, status: 'exists', razorpayPlanId: exact.id });
            continue;
        }

        if (candidates.length > 0) {
            // A plan with this fitconnect id/variant exists but price/interval differs.
            // Razorpay plans are immutable, so we mint a fresh one; pricing sync picks
            // the most recently created match. Flag it loudly so it's a deliberate change.
            const drift = candidates
                .map((c) => `${c.id} @ ₹${c.item.amount / 100}/${c.period}x${c.interval}`)
                .join(', ');
            if (!APPLY) {
                results.push({
                    desired: want,
                    status: 'mismatch',
                    razorpayPlanId: null,
                    note: `existing differs (${drift}); --apply would create a new plan @ ₹${want.amountRupees}`,
                });
                continue;
            }
            const created = await createPlan(want);
            results.push({
                desired: want,
                status: created.id ? 'created' : 'error',
                razorpayPlanId: created.id ?? null,
                note: `superseding ${drift}`,
            });
            continue;
        }

        if (!APPLY) {
            results.push({ desired: want, status: 'would-create', razorpayPlanId: null });
            continue;
        }
        const created = await createPlan(want);
        results.push({
            desired: want,
            status: created.id ? 'created' : 'error',
            razorpayPlanId: created.id ?? null,
            note: created.error,
        });
    }

    return results;
}

async function createPlan(want: DesiredPlan): Promise<{ id?: string; error?: string }> {
    try {
        const plan = await rzp.plans.create({
            period: want.period,
            interval: want.interval,
            item: { name: want.name, amount: want.amountRupees * 100, currency: 'INR' },
            notes: want.notes,
        });
        return { id: plan.id };
    } catch (err) {
        return { error: describeError(err) };
    }
}

// ---------------------------------------------------------------------------
// Webhook provisioning
// ---------------------------------------------------------------------------

function normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
}

function existingEvents(webhook: RzpWebhook): string[] {
    if (Array.isArray(webhook.events)) return webhook.events;
    return Object.entries(webhook.events ?? {})
        .filter(([, on]) => on)
        .map(([name]) => name);
}

function eventSetMatches(webhook: RzpWebhook): boolean {
    const current = new Set(existingEvents(webhook));
    return WEBHOOK_EVENTS.length === current.size && WEBHOOK_EVENTS.every((e) => current.has(e));
}

interface WebhookResult {
    status: 'exists' | 'created' | 'updated' | 'would-create' | 'would-update' | 'error' | 'manual';
    webhookId: string | null;
    note?: string;
}

async function provisionWebhook(): Promise<WebhookResult> {
    if (!WEBHOOK_SECRET) {
        if (GENERATE_SECRET) {
            WEBHOOK_SECRET = crypto.randomBytes(24).toString('hex');
            console.log(
                `\n  ⚠  Generated a webhook secret. Add this to the deployed app env ` +
                `(Vercel) as RAZORPAY_WEBHOOK_SECRET BEFORE going live, or signature ` +
                `verification will reject every event:\n     ${WEBHOOK_SECRET}\n`,
            );
        } else {
            return {
                status: 'error',
                webhookId: null,
                note:
                    'No webhook secret found. Set RAZORPAY_WEBHOOK_SECRET (it must match the ' +
                    'value the deployed app verifies against), or pass --generate-secret.',
            };
        }
    }

    let existing: RzpWebhook[] = [];
    try {
        const res = (await razorpayFetch('GET', '/webhooks?count=100')) as { items?: RzpWebhook[] };
        existing = res.items ?? [];
    } catch (err) {
        // Merchant webhook API may not be enabled on the account → fall back to manual.
        return { status: 'manual', webhookId: null, note: describeError(err) };
    }

    const match = existing.find((w) => normalizeUrl(w.url) === normalizeUrl(WEBHOOK_URL));

    // Razorpay's v1 webhook API wants `events` as an object map keyed by event
    // name ({ "subscription.activated": true }), NOT an array — an array makes its
    // backend read the numeric indices as event names and reject them.
    const params = {
        url: WEBHOOK_URL,
        secret: WEBHOOK_SECRET,
        events: Object.fromEntries(WEBHOOK_EVENTS.map((e) => [e, true])),
        ...(ALERT_EMAIL ? { alert_email: ALERT_EMAIL } : {}),
    };

    if (match) {
        const upToDate = eventSetMatches(match) && match.active !== false;
        if (upToDate) return { status: 'exists', webhookId: match.id };
        if (!APPLY) {
            return {
                status: 'would-update',
                webhookId: match.id,
                note: `events/active drift; --apply would PUT the correct ${WEBHOOK_EVENTS.length}-event set`,
            };
        }
        try {
            const updated = (await razorpayFetch('PUT', `/webhooks/${match.id}`, params)) as { id?: string };
            return { status: 'updated', webhookId: updated.id ?? match.id };
        } catch (err) {
            return { status: 'manual', webhookId: match.id, note: describeError(err) };
        }
    }

    if (!APPLY) return { status: 'would-create', webhookId: null };

    try {
        const created = (await razorpayFetch('POST', '/webhooks', params)) as { id?: string };
        return { status: 'created', webhookId: created.id ?? null };
    } catch (err) {
        return { status: 'manual', webhookId: null, note: describeError(err) };
    }
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function describeError(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
        const e = (err as { error: unknown }).error;
        if (e && typeof e === 'object' && 'description' in e) {
            return String((e as { description: unknown }).description);
        }
        return JSON.stringify(e);
    }
    return err instanceof Error ? err.message : String(err);
}

const STATUS_ICON: Record<string, string> = {
    exists: '=', created: '+', updated: '~', mismatch: '!', error: '✗',
    'would-create': '+', 'would-update': '~', manual: '→',
};

function printManualWebhook(reason?: string) {
    console.log('\n  Could not configure the webhook via API' + (reason ? ` (${reason})` : '') + '.');
    console.log('  Set it up manually: Dashboard → Settings → Webhooks → Add New Webhook\n');
    console.log(`    Webhook URL:   ${WEBHOOK_URL}`);
    console.log(`    Secret:        ${WEBHOOK_SECRET || '<set RAZORPAY_WEBHOOK_SECRET>'}  (must match the app env)`);
    console.log('    Active events:');
    for (const e of WEBHOOK_EVENTS) console.log(`      • ${e}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const mode = APPLY ? 'APPLY (writes enabled)' : 'DRY RUN (read-only)';
    const account = isTestKey ? 'TEST' : 'LIVE';
    console.log(`\nRazorpay setup — ${account} account (${KEY_ID})`);
    console.log(`Mode: ${mode}\n`);

    if (!SKIP_PLANS) {
        console.log('Plans (memberships, standard + founding):');
        const planResults = await provisionPlans();
        for (const r of planResults) {
            const icon = STATUS_ICON[r.status] ?? '?';
            const id = r.razorpayPlanId ? ` → ${r.razorpayPlanId}` : '';
            const detail = r.note ? `  (${r.note})` : '';
            console.log(`  ${icon} ${r.desired.label.padEnd(26)} ₹${String(r.desired.amountRupees).padEnd(7)} ${r.status}${id}${detail}`);
        }

        const liveStandards = planResults.filter(
            (r) => r.desired.variant === 'standard' && r.razorpayPlanId,
        );
        if (liveStandards.length) {
            console.log('\n  Static fallback IDs for shared/src/types/subscription.ts (optional —');
            console.log('  the app discovers plans by notes, but keep the fallback current):');
            for (const r of liveStandards) {
                console.log(`    ${r.desired.planId}: razorpayPlanId: '${r.razorpayPlanId}'`);
            }
        }
    }

    if (!SKIP_WEBHOOK) {
        console.log('\nWebhook:');
        const wh = await provisionWebhook();
        const icon = STATUS_ICON[wh.status] ?? '?';
        const id = wh.webhookId ? ` (${wh.webhookId})` : '';
        console.log(`  ${icon} ${WEBHOOK_URL}${id} — ${wh.status}`);
        console.log(`    events: ${WEBHOOK_EVENTS.join(', ')}`);
        if (wh.status === 'manual') {
            printManualWebhook(wh.note);
        } else if (wh.note) {
            console.log(`    ${wh.note}`);
        }
    }

    console.log('\nNext steps:');
    if (!APPLY) {
        console.log('  • This was a dry run — nothing changed. Re-run with --apply to provision.');
    } else {
        console.log('  • In the deployed app env (Vercel), set the LIVE values:');
        console.log('      RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_WEBHOOK_SECRET');
        console.log('  • Force a pricing refresh so settings/razorpayPlans repopulates from live:');
        console.log('      hit /api/subscriptions/pricing (or clear that Firestore doc).');
    }
    console.log('');
}

main().catch((e) => {
    console.error('\nFatal:', describeError(e));
    process.exit(1);
});
