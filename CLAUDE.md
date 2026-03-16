# FitConnect Pro — Project Configuration

## Project Overview
FitConnect Pro is a premium fitness class booking platform built with Next.js 16 (App Router), Firebase (Firestore, Auth, Cloud Functions), Tailwind CSS 4, Zustand, and Framer Motion.

## Tech Stack
- **Frontend:** Next.js 16.1.0, React 19, TypeScript 5, Tailwind CSS 4, Radix UI, Framer Motion, GSAP
- **Backend:** Firebase Cloud Functions v5 (Node.js 18), Firestore, Firebase Auth, Firebase Storage
- **State:** Zustand 5.0.9
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React ONLY
- **Charts:** Recharts
- **Deployment:** Vercel (frontend) + Firebase (functions)

## Design System
- **Colors:** Midnight navy (#0B0F19) base, Coral (#FF6A3D) primary accent, Amber (#FFB347) secondary
- **Spacing:** 8px grid (8, 16, 24, 32, 48, 64, 96)
- **Radius:** Sharp edges (0rem) — maximum 2 radius values across UI
- **Typography:** Extreme weight contrast (300 body / 800 headings), 3x+ size jumps for headings
- **Dark theme:** Rich darks only, never pure black/white
- **Shadows:** Elevation hierarchy only, not decorative

## Team Configuration ("start team")

When the user says **"start team"** or **"spin up the team"**, create a team with these four agents:

### Agent Roster

| Agent | Config File | Role | File Ownership |
|-------|------------|------|----------------|
| **frontend** | `.claude/agents/frontend.md` | Staff Frontend Engineer | `src/app/`, `src/components/`, `src/lib/hooks/`, `src/lib/store/`, `src/lib/utils.ts`, `src/types/`, `tailwind.config.ts`, `globals.css` |
| **backend** | `.claude/agents/backend.md` | Principal Backend Engineer | `functions/`, `firestore.rules`, `firestore.indexes.json`, `src/lib/firebase/` |
| **tester** | `.claude/agents/tester.md` | Principal Test Engineer | READ-ONLY — does not edit files, only reports issues |
| **reviewer** | `.claude/agents/reviewer.md` | Design Engineering Director | READ-ONLY — does not edit files, only reports issues |

### Team Rules (ENFORCED)
1. **File ownership is absolute.** No agent edits another agent's files. Send a message instead.
2. **Frontend and Backend announce shared interface changes** (types, API contracts) to each other immediately.
3. **Tester verifies** every completed task: runs `tsc --noEmit`, `npm run build`, and reviews code for edge cases.
4. **Reviewer inspects** every UI change against the Vibe-Coded Detection Framework. Any Tier 1 flag blocks the feature.
5. **No task is complete** until Tester AND Reviewer sign off.
6. **The lead (you) coordinates** — assigns tasks, resolves conflicts, makes architectural decisions.

### Startup Sequence
1. Create the team with `TeamCreate`
2. Create tasks based on user request with `TaskCreate`
3. Spawn all four agents as teammates using the `Task` tool with their respective agent configs
4. Assign initial tasks to agents
5. Monitor progress, relay messages between agents, resolve blockers

## Build Commands
```bash
npm run dev          # Dev server
npm run build        # Production build
npx tsc --noEmit     # Type check frontend
cd functions && npx tsc --noEmit  # Type check backend
npm run lint         # Lint
```

## Key Directories
```
src/app/                  → Pages (App Router)
src/components/ui/        → Atomic UI primitives
src/components/layout/    → Shell (Header, Footer, Sidebar)
src/components/admin/     → Admin composites
src/components/user/      → User composites
src/lib/firebase/         → Firebase config & utilities
src/lib/hooks/            → Custom hooks
src/lib/store/            → Zustand stores
src/types/                → TypeScript type definitions
functions/src/            → Cloud Functions
```

## Known Issues
- `src/types/admin.ts` has hardcoded admin credentials (admin/admin123) — CRITICAL security issue
- Font is Inter — consider upgrading to Satoshi or Space Grotesk per design standards
