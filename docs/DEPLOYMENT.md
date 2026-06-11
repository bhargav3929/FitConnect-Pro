# Deployment & CI/CD Runbook

FitConnect Pro ships through two environments with different rules:

| | **Dev / Staging** | **Production** |
|---|---|---|
| Firebase project | `fitness-booking-c8fb3` (alias `dev`) | new project (alias `prod`) |
| Plan | Blaze + budget alert | Blaze + budget alert |
| Git branch | `dev` | `main` |
| Trigger | **Automatic** on push to `dev` | **Manual** + approval |
| Vercel | Preview scope → staging domain | Production scope → prod domain |
| Razorpay | test keys | test keys (swap to live later) |

A "deploy" is atomic per environment: it ships the **Vercel web app** + **Firestore rules + indexes** + **Cloud Functions** together. Mobile (Expo / Firebase App Distribution) stays on its own workflow (`firebase-distribute.yml`) and is unaffected.

---

## Workflows

| File | Trigger | What it does |
|------|---------|--------------|
| `.github/workflows/ci.yml` | push/PR to `main` or `dev`; reusable (`workflow_call`) | Typecheck (shared + web) + tests (shared + mobile) + web build. The gate. |
| `.github/workflows/deploy-dev.yml` | push to `dev` (auto) | Runs `ci.yml` gate → deploys Vercel (preview/staging) + Firebase to `dev`. |
| `.github/workflows/deploy-prod.yml` | manual `workflow_dispatch` | Confirm input → `ci.yml` gate → **waits for `production` environment approval** → deploys Vercel (`--prod`) + Firebase to `prod`. |
| `.github/workflows/firebase-distribute.yml` | push to `mobile/**` or manual | Unchanged. Mobile App Distribution. |

Deploy only happens if the gate is green.

---

## One-time setup (YOU — console/billing, I can't do these)

### 1. Create the production Firebase project
1. <https://console.firebase.google.com> → **Add project** (e.g. `fitconnect-prod`).
2. Add a **Web app** to it → copy the `firebaseConfig` values (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
3. Enable the same products as dev: **Authentication** (same sign-in providers), **Firestore**, **Functions**, **Storage**.
4. Put the real project ID into **`.firebaserc`** (replace `REPLACE_WITH_PROD_PROJECT_ID`).

### 2. Blaze + budget alerts (BOTH projects)
Functions deploys require Blaze. For **each** project (`fitness-booking-c8fb3` and the new prod):
1. Firebase Console → ⚙️ → **Usage and billing** → **Modify plan** → **Blaze**.
2. Link a billing account.
3. **Set a budget alert** (e.g. $10/mo) so a runaway function can't surprise you: GCP Console → Billing → Budgets & alerts.

### 3. Deploy service accounts (BOTH projects)
For each project: Firebase Console → ⚙️ → **Service accounts** → **Generate new private key** → download the JSON.
- These are the credentials CI uses to deploy. Grant the service account the roles **Firebase Admin** (or at minimum: Cloud Functions Admin, Firebase Rules Admin, Cloud Datastore Index Admin, Service Account User).
- ⚠️ **Rotate the existing dev key** before going live — an old admin key currently sits in `.env.local` / a local `*-adminsdk-*.json` (both gitignored, not in git, but should not be reused for prod).

### 4. Vercel project
1. Create/import the project on Vercel (one project, per the chosen topology).
2. Get **`VERCEL_ORG_ID`** and **`VERCEL_PROJECT_ID`** (run `vercel link` locally, then read `.vercel/project.json`, or from project settings).
3. Create a **Vercel token**: Account → Settings → Tokens.
4. Add the app's env vars **in the Vercel dashboard**, scoped per environment — CI pulls these, they are NOT GitHub secrets:
   - **Preview** scope (= staging) → **dev** Firebase web config + Razorpay **test** keys.
   - **Production** scope → **prod** Firebase web config + Razorpay keys (test for now).
   - Keys: `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (see `.env.example`).
5. (Optional) Add a stable staging domain (e.g. `staging-fitconnect.vercel.app`) to the project, then set repo **variable** `VERCEL_STAGING_ALIAS` to it so dev deploys alias to it.

### 5. GitHub secrets & environment
**Repo → Settings → Secrets and variables → Actions → Secrets:**
| Secret | Value |
|--------|-------|
| `FIREBASE_SERVICE_ACCOUNT_DEV` | full dev service-account JSON (step 3) |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | full prod service-account JSON (step 3) |
| `VERCEL_TOKEN` | Vercel token (step 4) |
| `VERCEL_ORG_ID` | from step 4 |
| `VERCEL_PROJECT_ID` | from step 4 |

**Variables** (optional): `VERCEL_STAGING_ALIAS` = your staging domain.

**Repo → Settings → Environments → New environment → `production`:**
- Add **Required reviewers** (yourself). This is the approval gate that pauses `deploy-prod.yml` until a human clicks **Approve**.

### 6. Branch setup
```bash
git checkout -b dev && git push -u origin dev
```
Protect `main` (Settings → Branches): require PR + CI passing before merge.

---

## Day-to-day

**Ship to staging:** push/merge to `dev` → `deploy-dev.yml` runs automatically. Done.

**Ship to production:**
1. Merge `dev` → `main` (PR, CI green).
2. Actions tab → **Deploy Prod** → **Run workflow** → branch `main`, type `deploy` → Run.
3. Gate runs, then the run **pauses for approval** → click **Approve** on the `production` environment.
4. Vercel `--prod` + Firebase `prod` deploy.

---

## Production admin bootstrap (one-off)

The new prod project has no admin users — nobody can access the admin dashboard until you grant the first admin claim. After the user has signed up (or been created) in prod:

```bash
node scripts/grant-admin.mjs you@example.com --sa /path/to/prod-service-account.json
```

The script prints the target `project_id` so you can confirm you hit prod, not dev. The user must sign out/in for the new token to take effect.

---

## Notes & follow-ups
- **Functions runtime** bumped to Node 20 (`functions/package.json`); Node 18 is EOL and Firebase rejects it.
- **Razorpay → live:** when ready, swap the Production-scoped Vercel env vars to live keys and point the Razorpay live webhook at the prod domain.
- **Path filtering** (skip unchanged surfaces) is intentionally NOT enabled yet — every deploy ships everything. Add it if CI gets slow.
- **Rollback:** Vercel → instant rollback in dashboard. Firebase functions → redeploy a previous commit; rules → keep history in git.
