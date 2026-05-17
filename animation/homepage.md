# Homepage Animation Spec

Scroll-by-scroll motion design for the FitConnect / Sol homepage. Inspiration: **fifty50pilates.com** (Wix Studio + Wix "Motion" engine — `data-motion-enter`).

---

## What fifty50pilates is actually doing

Pulled from the live HTML. Their motion system is built on a small palette of named keyframes triggered when an element enters the viewport:

| Primitive | What it does | Best for |
|---|---|---|
| `motion-fadeIn` | opacity 0 → 1 | small text, captions, secondary labels |
| `motion-revealIn` | clip-path / mask wipe (top→bottom or left→right) | headings, hero word-by-word |
| `motion-shapeIn` | scale 0.92 → 1 + opacity 0 → 1 | cards, image tiles, CTAs |
| `slide-vertical-new` | translateY(40px) → 0 + fade | paragraphs, list items |
| `slide-horizontal-new` | translateX(±60px) → 0 + fade | two-column rows, alternating sides |
| `itemDepth` | scale + slight rotateX on hover | card hover states |
| BG scroll-scrub (`data-motion-part="BG_MEDIA"`) | background image translateY scrubbed to scroll | parallax sections |

Other observed patterns:
- **Hero is a looping muted `<video>`** (woman on reformer), `playsinline preload="auto" muted loop` — no Ken Burns; the motion *is* the footage.
- **Sticky horizontal menu** with `StylableHorizontalMenu` — no transform on scroll, just `position: sticky` with a background fill change.
- **Sections are pinned/parallax via `BG_LAYER` + `BG_MEDIA` pairs** — the background scrolls slower than the content stacked on top (classic parallax, scrubbed to scroll position, not just on enter).
- **Stagger is uniform** — ~80–120ms between sibling reveals, easing `cubic-bezier(0.22, 1, 0.36, 1)` (Wix "ease-out-quint" feel).
- **No custom cursor, no magnetic buttons, no horizontal scroll sections.** It's a calm, restrained motion language. Movement comes from the *content* (video, parallax backgrounds), not from gratuitous flourishes.

The takeaway for us: **5 reveal primitives + 1 parallax scrub + 1 video hero is the entire vocabulary.** We do not need more.

---

## Our animation vocabulary

Define these once as Framer Motion variants in `src/lib/animation/variants.ts` and reuse everywhere. Mirroring fifty50's palette:

```ts
// Timing constants
const EASE = [0.22, 1, 0.36, 1];        // ease-out-quint
const DUR_FAST = 0.5;
const DUR_BASE = 0.7;
const DUR_SLOW = 1.0;
const STAGGER = 0.1;                    // 100ms between siblings

// Variants
fadeIn:       opacity 0 → 1                                  // 0.5s
slideUp:      y 40 → 0, opacity 0 → 1                        // 0.7s
slideRight:   x -60 → 0, opacity 0 → 1                       // 0.7s
slideLeft:    x  60 → 0, opacity 0 → 1                       // 0.7s
shapeIn:      scale 0.94 → 1, opacity 0 → 1                  // 0.7s
revealIn:     clip-path inset(100% 0 0 0) → inset(0 0 0 0)   // 0.9s (mask wipe)
stagger:      staggerChildren: 0.1, delayChildren: 0.05
```

**Trigger rule:** `whileInView` with `viewport={{ once: true, margin: "-15% 0px" }}` — fires when the element is ~15% into view, plays once. Matches fifty50's `data-motion-enter="done"` (state stays `done` after first fire).

**Parallax rule:** GSAP ScrollTrigger or Framer's `useScroll` + `useTransform`. Background `y` translates `-15%` over the scroll range of its container. Foreground content does not move.

**Reduced motion:** wrap variants in a `useReducedMotion()` check. If true, opacity-only fades, no `y`/`x`/`scale`/`clip-path`. Mandatory.

---

## Scroll script (top to bottom)

Each section below lists: **what shows up**, **how it animates**, **how it maps to a primitive**. Components referenced are the real ones in `src/components/home/`.

### 0. Header — sticky, color-shifting

`src/components/layout/Header.tsx`

- **Initial state:** transparent background, white logo + nav text (sitting on top of hero video).
- **On scroll past 80px:** background fades to `--bg/95` with backdrop-blur over 200ms, nav text swaps to dark. Use `useScroll().scrollY` + `useTransform` to drive `backgroundColor` and `color`.
- **Mobile menu open:** full-screen overlay slides down (`y -100% → 0`, 400ms, ease-out-quint), nav items stagger in 60ms apart with `slideUp`.
- **No hamburger spin** — just clean cross-fade between burger icon and X.

### 1. Hero — `HeroSection.tsx`

The single highest-impact moment. Mirrors fifty50's looping reformer video.

- **Background:** muted, autoplaying, looping `<video>` (we already have `public/videos/`). `playsinline preload="auto"`. No Ken Burns. The video provides all background motion.
- **Page load timeline** (after video first frame paints):
  1. **t=0ms** — video starts at opacity 0, fades to 1 over 800ms.
  2. **t=200ms** — eyebrow label ("Reformer Pilates · Cedar Park") → `slideUp`, 500ms.
  3. **t=350ms** — H1 headline → `revealIn` line-by-line. Use a Split-Text approach (split into lines, each line gets clip-path mask reveal staggered 100ms). This is the hero moment — *only* the H1 gets this treatment on the whole page.
  4. **t=900ms** — supporting paragraph → `slideUp`, 600ms.
  5. **t=1100ms** — primary CTA + secondary CTA → `shapeIn`, staggered 80ms.
  6. **t=1400ms** — scroll-cue indicator at the bottom → `fadeIn` + infinite gentle bob (`y 0 → 6 → 0`, 2s, ease-in-out, repeats forever).
- **On scroll out:** the video container parallaxes `y: 0 → -15%` over its scroll range. Foreground text and CTAs do NOT move (avoids the cheap parallax-everything look).
- **No typewriter, no glitch, no shimmer.** The video is the spectacle.

### 2. Welcome / Intro paragraph

The fifty50 pattern is: a short H3 + a single paragraph sitting on a clean background, both reveal on scroll.

- **Eyebrow + H2** → `slideUp` (stagger 100ms).
- **Body paragraph** → `slideUp`, 700ms, delay 150ms after H2.
- Background stays static. No parallax here — gives the eye a rest after the hero.

### 3. WhySol — `WhySolSection.tsx` (feature grid)

Equivalent to fifty50's "Class Room / On-Demand Room" two-up rows + 6-feature grid.

- **Section header** (H2 + lead text) → `slideUp`, staggered 100ms.
- **Feature cards** — grid of 4–6 tiles:
  - Each card animates with `shapeIn` (scale 0.94 → 1, fade) on entry.
  - **Stagger by row, not by index.** Cards in the same row animate together; row 2 fires 200ms after row 1. (fifty50 staggers strictly by DOM order, which looks worse on wide grids — we improve on it.)
  - **Hover state:** card lifts (`y: 0 → -6px`, 250ms, ease-out), inner icon scales `1 → 1.08`, border color shifts to accent. No shadow drama — just elevation.
  - Cards have a thin top-border accent stripe that animates `scaleX(0) → scaleX(1)` from left on entry, 600ms after the card lands. This is our signature flourish (fifty50 doesn't do this — it's our differentiator).

### 4. ClassTypes — `ClassTypesSection.tsx` (3 core classes)

Direct parallel to fifty50's "OUR CORE CLASSES" 3-up row (Strength / Cardio / Stretch).

- **Section title** → `revealIn` (clip-path wipe) — this is the *second* place we use revealIn besides the hero. Used sparingly = stays special.
- **3 class cards** — each card is large, image-led:
  - Card image: enters with `shapeIn` (scale 0.94 → 1, 800ms).
  - Card text (title + description + CTA): `slideUp`, staggered 120ms inside the card.
  - Stagger between the 3 cards: 150ms.
  - **Hover:** image inside the card scales `1 → 1.06` over 600ms with `ease-out`. Container does NOT scale. CTA underline draws left-to-right (`scaleX(0) → scaleX(1)`, 300ms). This is the fifty50 hover pattern exactly.
- **Background:** subtle parallax — the section's background image (if any) translates `y: 0 → -10%` over scroll. Foreground cards stay locked.

### 5. Testimonials — `TestimonialsSection.tsx` + `TestimonialsCarousel.tsx`

fifty50 does not have a real testimonials carousel, but their slideshow primitives (`SlideshowRepeater_slideNextIn/Out`) give us the right pattern.

- **Section header** → `slideUp`.
- **Carousel:** quotes cross-fade with a 400ms overlap (current slide opacity 1 → 0 while next slide 0 → 1, both moving `x: ±20px → 0`). Use `AnimatePresence` with `mode="popLayout"` in Framer Motion.
- **Avatar / star rating:** drawn-on stars — each star fills with color one at a time, 80ms apart, after the slide settles. Small touch, big delight.
- **Dot pagination:** active dot expands width `8px → 24px` over 300ms.
- **Auto-advance:** 6 seconds per slide. Pauses on hover.

### 6. Tavaro / Studio showcase — `TavaroSection.tsx`

Maps to fifty50's "COME SEE OUR NEW STUDIOS" location callout. This is the right place for a heavier parallax beat — we've earned it by being restrained until now.

- **Layout:** image on one side, copy on the other (alternating).
- **Image:** enters with `revealIn` clip-path wipe from bottom (650ms). On scroll past, image translates `y: 0 → -8%` (parallax scrub).
- **Copy block:** eyebrow + H2 + paragraph + CTA → `slideUp` stagger (100ms between).
- **CTA button:** `shapeIn`, last in the stagger.

### 7. FoundingMembership / Pricing — `FoundingMembershipSection.tsx`

Maps to fifty50's "BECOME A MEMBER / NO COMMITMENTS" pricing tiers ("BEST VALUE" badge, $25 intro, etc).

- **Section header** + supporting text → `slideUp` stagger.
- **Pricing tiers (3 cards):**
  - Each card → `shapeIn`, stagger 150ms left-to-right.
  - The **"BEST VALUE" middle card** is taller and animates with a slightly bigger scale (`0.92 → 1` vs `0.94 → 1`) and a 50ms earlier start than its siblings — drawing the eye to it first.
  - **"BEST VALUE" badge** itself → drops in from above (`y: -20 → 0`, opacity 0 → 1, 400ms) *after* the card settles.
  - Price numerals → `slideUp` with a tighter 400ms duration, slight overshoot easing `cubic-bezier(0.34, 1.56, 0.64, 1)` (one-time accent — gives the price a little "pop" without being silly).
- **CTAs on each card:** standard `fadeIn`, no special treatment.

### 8. Instagram / Social proof — `InstagramSection.tsx`

fifty50 doesn't have this; we lean on Wix's gallery primitives logically.

- **Section header** → `slideUp`.
- **Photo grid (6–9 tiles):** masonry or even grid. Each tile → `shapeIn`, row-staggered (same logic as WhySol — cards in the same row animate together).
- **Hover:** image scales `1 → 1.06`, an overlay with the Instagram logo + caption fades in (`opacity 0 → 1`, 250ms).
- **Section background:** static. No parallax — keeps the focus on the imagery itself.

### 9. Footer — `src/components/layout/Footer.tsx`

- **On enter:** entire footer block → `slideUp`, 800ms, no internal stagger (it's a footer, not a hero).
- **No animation on the legal text or social icons** — they don't deserve attention here.
- **Newsletter input** (if present): focus state animates the bottom border `scaleX(0) → scaleX(1)` from left, 200ms.

---

## Cross-cutting rules (apply everywhere)

1. **Once is enough.** Every entrance animation uses `viewport={{ once: true }}`. Re-firing on scroll-back is amateur hour.
2. **Stagger is uniform.** 100ms between siblings unless explicitly overridden. Predictable = pro.
3. **Ease-out-quint everywhere** (`cubic-bezier(0.22, 1, 0.36, 1)`). Single easing function for 95% of motion. The only exception is the price-numeral overshoot in section 7.
4. **No animation lasts longer than 1 second.** If you need more time, you're trying too hard.
5. **Parallax is for backgrounds only.** Never parallax text or CTAs. The user is reading; let them.
6. **`will-change` only during the animation, not in the resting state.** Strip it after the animation completes to free GPU memory.
7. **`prefers-reduced-motion: reduce` → opacity-only fades, 200ms.** Hard requirement. Wire it into the variant hook.
8. **Touch-device hover states are pointless** — gate hover-only animations behind `@media (hover: hover)`.
9. **No layout-affecting animations.** Animate `transform` and `opacity`. Never `width`, `height`, `top`, `left`, `margin`. (The dot-pagination width is the lone exception — small enough to be fine.)
10. **Test on a throttled CPU.** If a section drops below 50fps on a 4× CPU throttle in Chrome DevTools, the animation is too heavy. Cut it.

---

## Implementation notes for the agent

### Libraries (already installed — do not add new deps)

- **Framer Motion `^12.25`** — entrance variants, hover states, viewport triggers.
- **GSAP `^3.14`** + **`@gsap/react`** — parallax scrubs and any pinned/scrubbed scroll work. Use `useGSAP()` from `@gsap/react`; do not register `ScrollTrigger` at module scope (Next.js SSR will break) — register inside the hook.
- **Do not add Lenis** in v1. Defer to v2.
- **Split-text:** there is no `motion-plus` in this project. Hand-split the hero H1 by line in the JSX (one `<span>` per line), wrap each in `<Reveal variant="revealIn">` with staggered `delay`. Do not measure or split at runtime.

### Files to create

The frontend agent must create exactly these two files before touching any section. Every section migration imports from them — no one-off `<motion.div animate={{...}}>` inline definitions are allowed.

#### 1. `src/lib/animation/variants.ts`

Plain TS module (no `"use client"`). Exports the 7 typed `Variants` defined in this doc plus the timing constants. Must export:

- Constants: `EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const`, `EASE_OVERSHOOT = [0.34, 1.56, 0.64, 1] as const`, `DUR_FAST = 0.5`, `DUR_BASE = 0.7`, `DUR_SLOW = 0.9`, `STAGGER = 0.1`, `STAGGER_DELAY = 0.05`.
- `Variants` named: `fadeIn`, `slideUp`, `slideRight`, `slideLeft`, `shapeIn`, `revealIn`, `stagger`, `reducedFade`.
  - Geometry per the "Our animation vocabulary" table above (don't re-derive — copy the numbers).
  - All visible-state transitions use `EASE_OUT_QUINT` and `DUR_BASE` unless this doc specifies otherwise (`fadeIn` → `DUR_FAST`, `revealIn` → `DUR_SLOW`).
  - `revealIn` uses `clipPath: "inset(100% 0% 0% 0%)" → "inset(0% 0% 0% 0%)"`.
  - `stagger` has no geometry — only `transition: { staggerChildren: STAGGER, delayChildren: STAGGER_DELAY }` on `visible`.
  - `reducedFade` is opacity-only, 200ms, `easeOut` — the substitute used when `prefers-reduced-motion: reduce`.
- A `variantsMap` object literal keyed by name and a `RevealVariant` type derived as `keyof typeof variantsMap`.

Import types from `framer-motion`: `import type { Variants, Transition } from "framer-motion"`. Do not import anything that triggers client-only code paths.

#### 2. `src/lib/animation/Reveal.tsx`

Client component (`"use client"` at the top). Exports two components:

**`<Reveal>`** — wraps a single element/subtree with an in-view entrance animation. Props:

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | — | required |
| `variant` | `RevealVariant` | `"slideUp"` | one of the 7 from `variantsMap` |
| `as` | `ElementType` | `"div"` | rendered tag; wrap with `motion(as)` |
| `delay` | `number` | — | seconds, applied via a `transition` override |
| `duration` | `number` | — | seconds, applied via a `transition` override |
| `once` | `boolean` | `true` | passed to `viewport` |
| `amount` | `number \| "some" \| "all"` | `"some"` | viewport threshold |
| `margin` | `string` | `"-15% 0px"` | viewport rootMargin |
| `className`, `style` | — | — | forwarded |
| ...rest | `MotionProps` | — | pass-through, but `variants` / `initial` / `whileInView` / `viewport` must be excluded from the public type so callers can't override them |

Behavior:
- Call `useReducedMotion()`. If true, swap variants for `reducedFade` and ignore `delay`/`duration` overrides (motion is already minimal — don't compound).
- Set `initial="hidden"`, `whileInView="visible"`, `viewport={{ once, amount, margin }}`.
- When `delay` or `duration` is provided, pass `transition={{ delay, duration }}` as an override — Framer merges it onto the variant's transition.

**`<RevealGroup>`** — parent that orchestrates stagger for child `<Reveal>` elements. Props mirror `<Reveal>` minus `variant`, plus `staggerChildren` (default `0.1`) and `delayChildren` (default `0.05`). Internally it constructs an inline variants object — it does NOT use the `stagger` export from `variants.ts` (those exports are static and not parameterizable). Under reduced motion, its variants collapse to `{ hidden: {}, visible: {} }` (no stagger timing).

Both components use `motion(as ?? "div")` to render the polymorphic tag.

### Usage pattern (for section migrations)

```tsx
import { Reveal, RevealGroup } from "@/lib/animation/Reveal";

<Reveal variant="slideUp">
  <h2>Heading</h2>
</Reveal>

<RevealGroup className="grid grid-cols-3 gap-6">
  {classes.map((c) => (
    <Reveal key={c.id} variant="shapeIn">
      <ClassCard {...c} />
    </Reveal>
  ))}
</RevealGroup>
```

### Migration order (do not reorder)

1. Create `variants.ts` and `Reveal.tsx`. Run `npx tsc --noEmit` and confirm clean before touching anything else.
2. Smoke-test on `src/app/about/page.tsx` and `src/app/founder/page.tsx` — both already use inline `whileInView` with `transition={{ duration: 0.7 }}`. Replace those with `<Reveal variant="slideUp">` and visually verify behavior is unchanged. This validates the wrapper before it's spread across the home sections.
3. Then migrate home sections in this order: `HeroSection` → `WhySolSection` → `ClassTypesSection` → `TestimonialsSection` → `TavaroSection` → `FoundingMembershipSection` → `InstagramSection` → header/footer.
4. Each section is its own task with Tester + Reviewer sign-off before moving to the next (per `CLAUDE.md` team rules).

### Parallax (GSAP) — separate wrapper, not in v1 scaffold

The Reveal wrapper is for entrance animations only. Parallax (hero video, Tavaro image, ClassTypes background) is a different concern and uses GSAP ScrollTrigger. Do not bake parallax into `<Reveal>`. When the first parallax section is implemented, create `src/lib/animation/Parallax.tsx` as a separate client component that takes `speed` (default `-0.15`, meaning `y: 0 → -15%`) and a child ref. That work is out of scope for this scaffold task — call it out and stop.

### Acceptance criteria for the scaffold task

- [ ] `src/lib/animation/variants.ts` exists with all 8 named exports + constants + `variantsMap` + `RevealVariant` type.
- [ ] `src/lib/animation/Reveal.tsx` exists with `<Reveal>` and `<RevealGroup>` exports, `"use client"` directive, reduced-motion handling.
- [ ] `npx tsc --noEmit` passes with zero new errors.
- [ ] No section components have been edited yet.
- [ ] No new dependencies added to `package.json`.

---

## Open questions (to resolve before building)

- Do we want a custom cursor on desktop? fifty50 does not. Recommendation: **no** — adds complexity, fights native scroll behaviors, often broken on touch hybrids.
- Should section 0 (Header) use a different animation language on mobile (e.g., always solid background)? **Yes** — hide-on-scroll-down / show-on-scroll-up pattern works better on small screens.
- Hero video format and weight budget? Needs to be ≤2MB, h.264 baseline + AV1 fallback, 1920×1080 cap. Confirm with the video files in `public/videos/`.
- Do we ship Lenis? Recommendation: **defer until v2** — get the entrance + parallax language right first, smooth-scroll is polish.
