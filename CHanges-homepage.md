# Homepage Redesign — Agent Brief

**Owner:** frontend agent (primary). reviewer + tester sign-off required.
**Scope:** `src/app/page.tsx` and any new section components under `src/components/home/`.
**Goal:** rebuild the homepage section-by-section per the new copy + structure below, and refactor it so each section is a **self-contained, dumb component** — every visual knob (background, padding, headline, image paths, button label) is a constant at the top of that section's file. No parent passes styling props in. Editing one section never requires reading another.

---

## 0. Architectural rules (READ THIS FIRST — applies to every section)

These rules exist because the current `page.tsx` is a 587-line monolith with inline data, inline animations, and shared state across sections. The user has explicitly said: **"To change a background color I don't have to look into the parents or their parents."** Honor that.

### 0.1 One section = one component file

Create `src/components/home/` and put each section there as its own file:

```
src/components/home/
  HeroSection.tsx                 // Section 1
  WhySolSection.tsx               // Section 2
  ClassTypesSection.tsx           // Section 3
  TestimonialsSection.tsx         // Section 4
  TavaroSection.tsx               // Section 5
  FoundingMembershipSection.tsx   // Section 6
  InstagramSection.tsx            // Section 7
```

`src/app/page.tsx` becomes thin — it just imports and stacks them:

```tsx
"use client";
import { useEffect } from "react";
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore";
import { FreeClassPopup } from "@/components/ui/FreeClassPopup";
import { HeroSection } from "@/components/home/HeroSection";
import { WhySolSection } from "@/components/home/WhySolSection";
import { ClassTypesSection } from "@/components/home/ClassTypesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TavaroSection } from "@/components/home/TavaroSection";
import { FoundingMembershipSection } from "@/components/home/FoundingMembershipSection";
import { InstagramSection } from "@/components/home/InstagramSection";

export default function Home() {
  const { isAuthenticated, initAuth } = useClientAuthStore();
  useEffect(() => initAuth(), [initAuth]);

  return (
    <main className="min-h-screen bg-peach-200 text-olive-400 font-sans overflow-x-hidden">
      <HeroSection />
      <WhySolSection />
      <ClassTypesSection />
      <TestimonialsSection />
      <TavaroSection />
      <FoundingMembershipSection />
      <InstagramSection />
      <FreeClassPopup isAuthenticated={isAuthenticated} />
    </main>
  );
}
```

That's the entire page file. No state, no data, no animations live in `page.tsx`.

### 0.2 Style + copy constants at the TOP of every section file

Every section component must follow this template:

```tsx
"use client";

// ============================================================
//  HERO SECTION — edit this block to change anything visual
// ============================================================
const STYLES = {
  // background / overlay
  bgClass: "bg-warmDark-800",                 // section background
  overlayClass: "bg-warmDark-800/55",         // dark scrim over video
  // spacing
  paddingY: "py-0",                           // vertical padding (use `py-N`)
  containerPaddingX: "px-6",
  // text colors
  headlineColor: "text-peach-50",
  bodyColor: "text-peach-200/90",
  // typography
  headlineFont: "font-display font-black tracking-tight",
  headlineSize: "text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95]",
  bodySize: "text-lg md:text-xl",
  // buttons
  primaryBtn: "bg-terra-400 text-peach-50 hover:bg-terra-300 shadow-glow",
  secondaryBtn: "border-2 border-peach-50 text-peach-50 hover:bg-peach-50 hover:text-warmDark-800",
};

const COPY = {
  headlineLine1: "Strong body.",
  headlineLine2: "Pain-free life.",
  body: "Contrology-based Pilates in a resort studio designed to make you feel as good as it looks.",
  primaryCta: { label: "Claim Your Free Class", href: "/free-class" },
  secondaryCta: { label: "Get Started", href: "#" },
};

const MEDIA = {
  videoSrc: "/videos/sol-hero.mp4",
  poster: "/images/sol-hero-poster.jpeg",
};

// ============================================================
//  Component
// ============================================================
export function HeroSection() {
  return ( /* render using STYLES, COPY, MEDIA — nothing else */ );
}
```

**Rules for the constants block:**
- `STYLES` = every Tailwind class group that controls visuals. Change a bg? Edit one line.
- `COPY` = every string the user might want to reword.
- `MEDIA` = every image/video path.
- These three constants must hold **everything a non-engineer would want to change.** If a value is duplicated inline in the JSX, that's a bug — pull it up.
- No `cn()` magic that hides classes. Use plain template strings: `` `${STYLES.bgClass} ${STYLES.paddingY}` ``.

### 0.3 No prop drilling, no cross-section state

- Sections must not accept styling props from `page.tsx`.
- Sections must not share state with each other. The hero auth state is the only exception (and it's read from `useClientAuthStore` directly inside `HeroSection`, not passed in).
- Delete the slider state, `expandedService`, `showScrollTop`, the `ProgressBar`/`STATS`/`DecorativeIcon` blocks, and the entire "PERFORMANCE" section from `page.tsx` — they're not in the new design.

### 0.4 Animations (READ CAREFULLY — this is now the centerpiece of the redesign)

The previous brief said "entrance fades only." That's wrong. **Simple fade-in/fade-out makes the site feel like a template.** We are rebuilding the homepage to feel like an Awwwards-grade premium wellness site — every section should have one signature motion moment that earns attention without becoming a circus.

#### 0.4.1 Animation philosophy

1. **One signature motion per section.** Not five. The eye should know exactly what to look at as it scrolls in. If a section already has a strong photo or headline, the motion supports it — it does not compete.
2. **Scroll-driven beats time-driven.** Prefer `useScroll` + `useTransform` (scroll-linked) over `whileInView` fire-and-forget fades. Scroll-linked feels intentional and premium; on-mount fades feel cheap.
3. **Slow, weighted easing.** Default easing for everything is a custom cubic: `[0.22, 1, 0.36, 1]` (a soft "easeOutExpo" curve). Durations: 0.8s–1.2s for entrances, 1.4s–1.8s for hero reveals. Nothing should snap.
4. **Stagger is mandatory** when more than one element animates together. Children stagger at `0.08s`–`0.12s` apart. Never animate three cards at once with identical timing.
5. **Respect `prefers-reduced-motion`.** Wrap every meaningful animation in a check. Add a `useReducedMotion()` hook at the top of any section that animates and short-circuit transforms to static values when it returns `true`. This is non-negotiable — reviewer flags will block merge.
6. **Hardware-accelerated properties only.** Animate `transform` (translate, scale, rotate) and `opacity`. Never animate `width`, `height`, `top`, `left`, `margin`, `padding`, or `filter: blur()` on scroll — they jank on mid-range Android.
7. **No animation on background colors, no animation on text shadows, no animation on box-shadows.** These do not pay for themselves.
8. **Mobile first.** Every animation must be tested at 375px-wide viewport. If it looks busy or causes layout shift on mobile, simplify it for the mobile breakpoint (use a `useReducedMotion`-style gate via `window.matchMedia('(max-width: 768px)')` or just render the static version below `md`).

#### 0.4.2 Stack & libraries

- **`framer-motion` v11+** is the primary animation lib (already in `package.json`). Use it for scroll-linked transforms, variants, staggers, layout animations.
- **`gsap`** (already installed for SplitText-style work) is allowed **only for the hero headline split-text reveal**. Don't sprinkle GSAP across the site — it doubles bundle weight.
- **Lenis smooth scroll** (`@studio-freight/lenis`) — install and wire up in `src/app/layout.tsx` via a thin client component so the entire site gets smooth-scroll. **Coordinate with backend agent** before adding the dep so the bundle-size budget is acknowledged. Lenis is what makes the scroll-driven sections feel premium instead of janky.
- **No `aos`, no `react-reveal`, no `wow.js`.** Those are template-tier.

#### 0.4.3 Shared animation primitives

Create `src/lib/animation/` and add these reusable bits (frontend agent owns this folder):

```
src/lib/animation/
  easings.ts          // export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
  variants.ts         // shared framer-motion variant presets (fadeUp, staggerContainer, etc.)
  useLenis.ts         // initializes Lenis once; exposes a hook for scroll-locked sections
  useReveal.ts        // wrapper around useInView with our defaults (once: true, margin: "-15%")
```

These are the **only** shared animation files. Each section still owns its own scroll-linked transforms — don't try to over-abstract.

Example `variants.ts`:

```ts
import { EASE_OUT_EXPO } from "./easings";

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
};

export const staggerContainer = (stagger = 0.1, delayChildren = 0.1) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

export const maskReveal = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  visible: { clipPath: "inset(0 0 0% 0)", transition: { duration: 1.1, ease: EASE_OUT_EXPO } },
};
```

#### 0.4.4 Where to put animation logic

- **Scroll-linked transforms** (parallax, sticky-stack scale, progress-driven rotation) live inside the section component, scoped to a `useRef` + `useScroll({ target: ref })`.
- **Reveal-on-enter** uses `motion.whileInView` with `viewport={{ once: true, margin: "-15%" }}` so animations fire slightly before the element fully enters the viewport.
- **Never** put a global `<AnimatePresence>` in `page.tsx`. Each section is self-contained.

#### 0.4.5 Performance gates (tester will check these)

- Lighthouse CLS on `/` must stay **under 0.05**. Animations that translate elements after layout count — reserve space with `min-height` or use `transform` instead of `top`/`margin`.
- Lighthouse INP must stay **under 200ms**. If a scroll-linked transform is firing on every scroll event, throttle via `useTransform` (which already runs on rAF) and never via `useState` + `useEffect`.
- Animated images must declare explicit `width`/`height` (Next `<Image>` does this — use it, don't drop to raw `<img>`).

---

### 0.5 Token palette (use these, don't invent new ones)

The existing Tailwind palette is already loaded. Stick to:

| Role | Class |
|---|---|
| Dark background | `bg-warmDark-800` (deep brown) |
| Light background (page default) | `bg-peach-200` (warm cream) |
| Alt light background | `bg-peach-100`, `bg-peach-300` |
| Primary accent (CTAs, dots, underlines) | `bg-terra-400` / `text-terra-400` |
| Hover accent | `bg-terra-300` / `text-terra-300` |
| Heading on dark | `text-peach-200` / `text-peach-50` |
| Heading on light | `text-olive-600` |
| Body on light | `text-olive-400` / `text-olive-300` |
| Body on dark | `text-peach-400` |
| Borders on dark | `border-peach-200/10` |
| Borders on light | `border-olive-400/10` |

Fonts: `font-display` = Helvetica Now Display (headings), `font-sans` = Plus Jakarta Sans (body). Both are already wired in `globals.css`.

---

## 1. Free-class popup (already exists — light touch only)

File: `src/components/ui/FreeClassPopup.tsx`

It already opens 6s after page load on the homepage, dismisses to sessionStorage, and routes to `/free-class`. Leave it functional. Two tweaks:

1. Confirm the CTA label inside the popup reads exactly **"Claim Your Free Class"** (it does — keep it).
2. Update the headline copy block from `YOUR FIRST / CLASS IS / ON US.` to a single line that matches the new brand voice:
   - **Headline:** `Your first class is on us.`
   - **Subhead:** `Contrology-based Pilates inside Tavaro Resorts. Try a session free — no commitment.`
   - Use `font-display font-black text-3xl md:text-4xl text-olive-600 leading-[1.05]` for the headline (drop the all-caps stack).
3. Promote the popup's style/copy block into a `STYLES`/`COPY` constant pair at the top of the file, same pattern as section components.

No layout changes, no animation changes.

---

## 2. SECTION 1 — Hero (`HeroSection.tsx`)

### Copy
- **Headline (two lines):**
  - Line 1: `Strong body.`
  - Line 2: `Pain-free life.`
- **Body (one paragraph):** `Contrology-based Pilates in a resort studio designed to make you feel as good as it looks.`
- **Primary CTA:** `Claim Your Free Class` → `/free-class`
- **Secondary CTA:** keep `Get Started` (opens `GetStartedModal` if not authed, else routes to `/user/dashboard`). The modal logic stays. Move it inside `HeroSection` — it's local to this section, not the page.

### Typography change
The current hero uses ALL CAPS + `font-black` (extreme weight). The new direction is **sentence case** with the same strong serif/display feel. Use:

```
font-display font-black tracking-tight leading-[0.95]
text-5xl sm:text-6xl md:text-7xl lg:text-8xl
text-peach-50
```

**Important:** do not uppercase the headline. Render it exactly as written: `Strong body.` / `Pain-free life.`. The capital S and P should be the only uppercase letters.

### Media
The current background video at `/videos/sol-hero.mp4` should be replaced with a new Pilates clip. For now keep the same `<video>` tag — just update the `STYLES`/`MEDIA` constants block so the next person can swap it by editing one path. Add a TODO comment in `MEDIA`:

```ts
const MEDIA = {
  // TODO: swap to new hero video when ready (Pilates-in-studio shot)
  videoSrc: "/videos/sol-hero.mp4",
  poster: "/images/sol-hero-poster.jpeg",
};
```

### Layout
- Full-viewport (`min-h-screen`), centered content, dark overlay over video.
- Two CTAs stacked on mobile, side-by-side on `sm`+.

### Animation spec — Hero (REPLACES the old "entrance fade")

The hero must read as a deliberate, cinematic open. Three layered motions, sequenced:

1. **Background video — slow Ken Burns + scroll parallax.**
   - On mount, animate the video element with `scale: 1.05 → 1.0` over **6s**, ease `EASE_OUT_EXPO`. This is the Ken Burns drift — almost imperceptible, but adds depth.
   - On scroll, use `useScroll({ target: heroRef, offset: ["start start", "end start"] })` and map `scrollYProgress` → `y: [0, 120]` (translate the video down 120px as the hero scrolls out) and `scale: [1, 1.15]`. This is the classic premium parallax — the video "stays" while content scrolls over it.
   - Dark overlay opacity: `useTransform(scrollYProgress, [0, 1], [0.55, 0.85])` so the scrim deepens as the user scrolls past, easing the eye into the next section.

2. **Headline — split-text line reveal with mask.** This is the section's signature motion.
   - Render each line of the headline (`Strong body.` / `Pain-free life.`) inside its own `overflow-hidden` wrapper.
   - Each line starts at `y: 110%` (fully clipped below) and animates to `y: 0%` with `duration: 1.1s`, ease `EASE_OUT_EXPO`.
   - Stagger the two lines by **0.12s**. Line 1 starts at `delay: 0.3s` (after first paint), Line 2 at `delay: 0.42s`.
   - Use Framer Motion variants — do not pull in GSAP for this. A `motion.span` with `initial={{ y: "110%" }} animate={{ y: "0%" }}` inside an `overflow-hidden` parent is enough.
   - Optional polish: split on **word**, not character. Word-by-word feels grounded; character-by-character feels like a typing demo.

3. **Body + CTAs — soft rise.**
   - Body paragraph: `opacity: 0 → 1`, `y: 24 → 0`, `duration: 0.8s`, ease `EASE_OUT_EXPO`, `delay: 0.9s` (after headline lines have started).
   - CTA group: same easing, `delay: 1.05s`, stagger children `0.08s` so the primary button lands a hair before the secondary.
   - Primary CTA gets a **subtle ambient pulse** after entrance — a `box-shadow` glow that breathes via the existing `shadow-glow` utility. Keep it slow (3s cycle, `opacity` only — no scale).

4. **Scroll-hint indicator (optional, low priority).**
   - Only add if reviewer approves: a thin 1px vertical line at bottom-center with a dot that loops `y: 0 → 16 → 0` over 1.8s. Hide on `prefers-reduced-motion`. Fade out after the user has scrolled even 50px (`useScroll` again).

### Out of scope for this section
- No extra badges, no kinetic typography, no canvas particles, no cursor follower.

---

## 3. SECTION 2 — Why Sol (`WhySolSection.tsx`)

**Replaces the current "STRENGTHEN, SCULPT, TRANSFORM" services slider entirely.** Delete the slider code from `page.tsx` — do not port it.

### Structure
- Section header: small eyebrow + headline.
  - Eyebrow: `THE STUDIO` (`text-xs tracking-[0.3em] uppercase text-terra-400`)
  - Headline: `Why Sol` (`font-display font-black text-4xl md:text-6xl text-olive-600`, sentence case).
- Three-card horizontal strip below (1 col mobile, 3 col `md`+, `gap-6`).

### The three cards

Each card is the same shape: image on top, then label + body underneath. Define the cards as a local constant array:

```ts
const CARDS = [
  {
    label: "The Method",
    body: "Rooted in Contrology — the original Pilates system. Strength training principles built in, not bolted on.",
    image: "/images/why-sol/method.jpg",         // TODO: Pilates move shot
    alt: "Pilates instructor demonstrating a Contrology move",
  },
  {
    label: "The Space",
    body: "Inside Tavaro Resorts, Hyderabad. A studio that feels like a destination, because it is.",
    image: "/images/why-sol/space.jpg",          // TODO: Tavaro exterior/lobby
    alt: "Tavaro Resorts grounds",
  },
  {
    label: "The Result",
    body: "Less pain. More strength. A body that works for the life you're actually living.",
    image: "/images/why-sol/result.jpg",         // TODO: client doing a daily activity (lifting kid / hiking / etc.)
    alt: "Client living an active daily life",
  },
];
```

### Card style
- Image: `aspect-[4/5]` (portrait), `object-cover`, no border radius (sharp edges per design system, `rounded-none`).
- Label below image: `font-display font-bold text-xl md:text-2xl text-olive-600 mt-6`.
- Body: `text-olive-400 text-base leading-relaxed mt-3 max-w-sm`.
- No hover effect required. No "expand" interaction. Just three clean cards.

### Section background
`bg-peach-200` (same as page default) with `py-24 md:py-32`.

### Animation spec — Why Sol

Signature motion: **image clip-reveal + staggered card rise**. Calm, editorial, no parallax tricks.

1. **Section header (eyebrow + headline) — mask reveal.**
   - Eyebrow fades + rises 16px, `delay: 0`, `duration: 0.6s`.
   - Headline uses the same line-mask treatment as the hero, but shorter — single line of text inside `overflow-hidden`, `y: 100% → 0%`, `duration: 0.9s`, `ease: EASE_OUT_EXPO`, `delay: 0.15s`.
   - Trigger via `whileInView` with `viewport={{ once: true, margin: "-20%" }}`.

2. **Three cards — staggered fade-up + image mask-reveal.** This is the section's signature.
   - Wrap the three cards in a `motion.div` with `variants={staggerContainer(0.14, 0.2)}` so each card enters **140ms** after the previous.
   - Each card's container: `opacity: 0 → 1`, `y: 60 → 0`, `duration: 1.0s`, `ease: EASE_OUT_EXPO`.
   - Each card's **image** gets a separate mask-reveal inside the card: `clipPath: "inset(0 0 100% 0)" → "inset(0 0 0% 0)"`, `duration: 1.2s`, `delay: 0.1s` after the card container starts. The mask wipes from top-down — feels like a curtain rising. (Use the `maskReveal` variant from `variants.ts`.)
   - The label + body text underneath each image: own `fadeUp` variant, `delay: 0.4s` after the image mask, `duration: 0.7s`. So per card the sequence is: container settles → image wipes in → text rises.

3. **Hover affordance on cards (subtle).**
   - On hover: image scales `1.0 → 1.04` over `0.6s`. Card itself does NOT lift or shadow-shift — keep it flat and editorial.
   - On touch devices, disable the hover scale (use `@media (hover: hover)` in a `whileHover` gate).

### Out of scope
No carousel, no slider, no expandable behavior, no card-stack scroll effect for this section (we save the stack-scroll for Class Types). The whole point of this section is calm + scannable.

---

## 4. SECTION 3 — One Studio, Three Ways to Move (`ClassTypesSection.tsx`)

This replaces the current `<FacilitiesSection />` (`src/components/ui/facilities-cards.tsx`). Build it fresh as `ClassTypesSection.tsx` so all home sections live in `src/components/home/`. Do not edit `facilities-cards.tsx`. After the new section is in place and `page.tsx` no longer imports it, you may delete `facilities-cards.tsx` (confirm with the lead first).

### Header
- Headline: `One studio, three ways to move.` (`font-display font-black text-4xl md:text-6xl text-olive-600`, sentence case).
- No eyebrow, no body paragraph.

### The three classes

```ts
const CLASSES = [
  {
    name: "Sol Flow",
    status: null,                          // null = available, otherwise a label
    body: "Strength meets movement in one seamless sequence. No breaks, no rush. Just continuous work that builds your body and clears your mind.",
    image: "/images/classes/sol-flow.jpg",     // TODO: long-stretch shot
    alt: "Long stretch on reformer",
  },
  {
    name: "Sol Cardio",
    status: "Coming soon",
    body: "High-energy reformer sequences that build endurance and leave you breathless (in the best way).",
    image: "/images/classes/sol-cardio.jpg",   // TODO: jumpboard shot
    alt: "Jumpboard cardio sequence",
  },
  {
    name: "Sol Stretch",
    status: "Coming soon",
    body: "Your body's reset button. Long, intentional stretches that undo tension and restore the way you were meant to move.",
    image: "/images/classes/sol-stretch.jpg",  // TODO: mermaid shot
    alt: "Mermaid stretch",
  },
];
```

### Layout
- 1 col mobile, 3 col `md`+, `gap-8`.
- Each card: full-bleed image (`aspect-[3/4]`), name + body underneath.
- If `status` is non-null, render a small pill above the name: `text-[10px] tracking-[0.25em] uppercase text-terra-400 border border-terra-400/40 px-3 py-1 inline-block mb-3`.
- Name: `font-display font-bold text-2xl md:text-3xl text-olive-600`.
- Body: `text-olive-400 text-base leading-relaxed mt-2`.

### Section background
`bg-peach-100` (slightly lighter than page) with `py-24 md:py-32`. This gives subtle visual separation from the surrounding `bg-peach-200`.

### No autoplay carousel
The current `facilities-cards.tsx` has an auto-rotating accordion with `IntersectionObserver`. **Do not replicate that.** Render three static cards. The user wants clear, simple, easy to edit.

### Animation spec — Class Types (THE BIG ONE: sticky scroll card stack)

This section is where the site earns its "cool animation" reputation. Cards do **not** sit side-by-side static — they **stack on top of each other as the user scrolls**, like a deck being dealt. Inspired by Apple product pages and the Olivier Larose / Skiper UI card-stack patterns.

#### Behavior

- On desktop (`md`+), the three class cards are rendered as **sticky-positioned**, full-width, one per viewport.
- As the user scrolls through this section, each card sticks to the top of the viewport for one "screen" of scroll, then the next card slides up and overlaps it.
- The card underneath does NOT disappear — it stays pinned and scales down slightly (`scale: 1 → 0.92`) and rotates a hair (`rotate: 0 → -2deg`) so the user perceives the stack physically deepening. Each "layer" is visibly tucked behind.
- The top card (the most recent one stacked) has a soft elevated shadow (`shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.4)]`) on its top edge so the visual hierarchy reads top-down.

#### Implementation pattern

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ["start start", "end end"],
});

// Outer container is tall enough to allow 3 cards × 100vh scroll
<section ref={containerRef} className="relative" style={{ height: `${CLASSES.length * 100}vh` }}>
  {CLASSES.map((cls, i) => {
    const targetScale = 1 - (CLASSES.length - i) * 0.04;
    const range = [i * (1 / CLASSES.length), 1];
    const scale = useTransform(scrollYProgress, range, [1, targetScale]);
    return (
      <motion.div
        key={cls.name}
        style={{ scale, top: `${10 + i * 16}px` }}
        className="sticky h-screen flex items-center justify-center"
      >
        {/* card body */}
      </motion.div>
    );
  })}
</section>
```

- Each card occupies `100vh` worth of scroll, but visually they collapse on top of each other via `sticky` + per-card `top` offset.
- The `scale` transform compresses earlier cards more than later cards — by the time the user reaches card 3, card 1 has scaled down to ~0.88 and card 2 to ~0.92.
- The image inside each card gets a **counter-parallax** — as the card itself scales down, the image inside translates `y: 0 → -40px` so it feels like the card has depth, not just paper.

#### Mobile fallback

On mobile (`<md`), **skip the stacking entirely**. Render the three cards vertically stacked as normal flow with the same fade-up reveal as the "Why Sol" cards (stagger 0.14s, fade-up 60px, mask-reveal the image). Sticky card-stacks at 375px wide feel claustrophobic and break scroll momentum.

Gate with: `const isMobile = useMediaQuery("(max-width: 768px)")` and render two different JSX trees. Don't try to make one tree do both — it always ends in compromise.

#### Status pill animation

For cards with `status: "Coming soon"`, the pill **shimmers**: a subtle horizontal gradient sweep across the pill background every 3.5s, using `background-position` animation (this is the ONE exception to "no background animation" — pills are small and the effect is iconic).

```css
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 3.5s ease-in-out infinite; }
```

Wrap inside the pill border, `pointer-events: none`, only on `Coming soon` pills.

#### Reduced-motion fallback

When `useReducedMotion()` returns true, render the mobile-style stacked layout regardless of viewport. No sticky, no scale, no parallax.

---

## 5. SECTION 4 — Testimonials (`TestimonialsSection.tsx`)

The data lives in `page.tsx` today (8 testimonials, lines 427–476). Move that array into `TestimonialsSection.tsx` as a local constant.

### Changes from current
1. **Smaller client photos.** Current avatars are 12×12 (48px). Drop to **w-10 h-10** (40px) or smaller. Some testimonials may not have a photo — when a testimonial's `src` is empty/missing, render a **monogrammed circle** (first letter of `name` on `bg-terra-400/20 text-terra-400`, same size as the photo would be) so cards don't look uneven.
2. **Auto-scroll.** The carousel must advance on its own. Use a 5s interval, pause on hover/touch. Keep the existing prev/next arrows + dot indicators for manual control.
3. **Keep** the carousel layout (horizontal snap-scroll, one card visible at a time, dark `bg-warmDark-800` section).

### Implementation guidance
- Edit `src/components/ui/TestimonialsCarousel.tsx` to add auto-scroll. Add a `useEffect` that calls `scrollByCard(1)` every 5000ms, clearable on `mouseenter`/`pointerdown`, restarted on `mouseleave`/`pointerup`. When at the last card, loop back to the first (`scrollTo({ left: 0 })`).
- Update the avatar block (lines 54–57 of `TestimonialsCarousel.tsx`) to fall back to the monogram if `t.src` is empty.
- Shrink the avatar from `w-12 h-12` to `w-10 h-10`. Also shrink the ring from `ring-2` to `ring-1`.

### Allow empty `src`
Update the `Testimonial` type:
```ts
export type Testimonial = {
  name: string;
  role: string;
  quote: string;
  src?: string;   // optional now
};
```

### Section header (unchanged copy, but lift constants to the top)
- Eyebrow: `Success Stories`
- Headline: `Testimonials`
- Body: `Hear from our community about their transformative Pilates journey.`

Put these in a `COPY` constant block at the top of `TestimonialsSection.tsx`.

### Animation spec — Testimonials

Signature motion: **infinite seamless marquee + scroll-velocity tilt**. Replace the snap-scroll carousel pattern with a continuously moving strip.

1. **Continuous marquee (the main interaction).**
   - Duplicate the testimonials array twice and render them in a single horizontal strip wide enough to overflow. Animate the strip's `x` from `0` to `-50%` (half the duplicated width) on an infinite loop, `duration: 60s`, `ease: "linear"`, `repeat: Infinity`. Because the second half is a clone of the first, the loop is seamless.
   - **Pause on hover/touch** by toggling `animationPlayState: paused`. On `mouseleave`/`pointerup`, resume from current position (don't reset to 0).
   - Drop the existing arrow buttons + dot indicators — they're carousel-pattern and conflict with the marquee. Reviewer may push back; if so, keep arrows but make them nudge the marquee by one card-width and resume autoplay 2s later.

2. **Scroll-velocity tilt (the polish layer).**
   - Use `useScroll` + `useVelocity` + `useSpring` from framer-motion to feed page scroll velocity into the marquee's translation. When the user scrolls fast, the marquee briefly accelerates in the same direction; when they stop, it returns to the baseline 60s loop. This is the trick that makes the section feel alive instead of robotic.
   - Spring config: `{ damping: 50, stiffness: 400 }`. Cap the velocity boost so it never moves more than ~150px/s extra.
   - Tutorial reference: this is the same pattern used in many Awwwards-winning sites for marquee strips that "react to scroll."

3. **Card entrance (when section first enters viewport).**
   - The marquee strip fades in from `opacity: 0 → 1` and `y: 40 → 0` over 0.9s, `delay: 0.2s` after the section header animates.
   - The header (eyebrow + headline + body) uses the same line-mask + fade-up combo as the Why Sol header. Three-step stagger of `0.1s` between eyebrow, headline, body.

4. **Monogram fallback animation.**
   - When a testimonial has no `src`, the monogram circle gets a one-shot `scale: 0.6 → 1` + `opacity: 0 → 1` on first reveal, `duration: 0.5s`, `ease: EASE_OUT_EXPO`. This makes the monogram feel intentional, not "missing image."

5. **Mobile.**
   - Marquee runs at the same speed; cards are narrower. Velocity-tilt stays on. Pause on `touchstart`, resume on `touchend + 1s` delay.

6. **Reduced motion.**
   - No marquee. Fall back to a non-animated 3-column grid on `md`+ or single-column stack on mobile. Auto-scroll disabled entirely.

---

## 6. SECTION 5 — Tavaro (`TavaroSection.tsx`)

New section. Matches the screenshot the user shared (small badge, headline, body, three-image grid).

### Header
- Eyebrow pill: `OPENING JULY 2026 · HYDERABAD`
  - Style: `inline-block border border-terra-400/40 text-terra-400 text-[11px] tracking-[0.2em] uppercase px-4 py-1.5 rounded-full bg-terra-400/5`
- Headline: `A space that makes showing up the easy part.`
  - Style: `font-display font-black text-4xl md:text-5xl text-olive-600 mt-6 max-w-3xl leading-[1.05]`
- Body: `Sol Pilates Studio is inside Tavaro Resorts. Beautiful, intentional, and designed to make every visit feel like more than just a workout.`
  - Style: `text-olive-400 text-lg leading-relaxed mt-4 max-w-2xl`

### Image grid
Three images in a **2-column** layout. Left column has one big image (Tavaro resort hero) spanning full height. Right column has two stacked images (smaller Tavaro shot on top, studio construction shot on bottom).

```
+-----------------------+-----------+
|                       |  Tavaro   |
|                       |  grounds  |
|   Tavaro resort       +-----------+
|   hero photo          |  Studio   |
|                       |  (under   |
|                       |  constr.) |
+-----------------------+-----------+
```

Implementation:
- Outer: `grid grid-cols-1 md:grid-cols-3 gap-4 mt-12` (large card spans 2 cols on md+, stack vertically on mobile).
- Big image: `md:col-span-2 aspect-[4/3] md:aspect-auto md:h-full` with `object-cover`.
- Right column: `grid grid-rows-2 gap-4`, each child `aspect-[4/3] md:aspect-auto`.
- All images `rounded-2xl` to match the reference screenshot (yes, the rest of the site is sharp-edged — the Tavaro section is the one exception per the reference). If reviewer pushes back on this, fall back to `rounded-none`.
- The studio-construction image should have a dashed border to signal "coming soon": `border border-dashed border-olive-400/30` and a small caption overlay `Studio space — coming soon` (bottom-left, `text-xs text-olive-400 bg-peach-100/90 px-3 py-1.5`).

```ts
const IMAGES = {
  hero: { src: "/images/tavaro/resort-hero.jpg", alt: "Tavaro Resorts" },           // TODO
  grounds: { src: "/images/tavaro/grounds.jpg", alt: "Tavaro grounds, pool, lobby" }, // TODO
  studio: { src: "/images/tavaro/studio.jpg", alt: "Studio space, under construction", caption: "Studio space — coming soon" }, // TODO
};
```

### Section background
`bg-peach-200`, `py-24 md:py-32`.

### Animation spec — Tavaro

Signature motion: **image grid mask-reveal in a diagonal cascade + internal parallax**.

1. **Header (badge + headline + body) — soft sequence.**
   - Eyebrow pill: `scale: 0.92 → 1` + `opacity: 0 → 1`, `duration: 0.6s`, ease `EASE_OUT_EXPO`. Trigger via `whileInView`, `viewport={{ margin: "-15%" }}`.
   - Headline: line-mask reveal — split on `\n` if it has two lines, otherwise single mask. `y: 100% → 0%`, `duration: 1.0s`, `delay: 0.15s`.
   - Body: fadeUp variant, `delay: 0.35s`, `duration: 0.7s`.

2. **Image grid — diagonal cascade mask-reveal.** This is the signature.
   - All three images start hidden via `clip-path: inset(100% 0 0 0)` (clipped from top).
   - They reveal sequentially with a **diagonal bias**: big-left first (`delay: 0.0s`), then top-right (`delay: 0.18s`), then bottom-right (`delay: 0.36s`). Each one: `clipPath` to `inset(0 0 0 0)`, `duration: 1.2s`, ease `EASE_OUT_EXPO`.
   - The big-left image reveal goes top-down; the right-column images reveal **left-to-right** (`clip-path: inset(0 100% 0 0) → inset(0 0 0 0)`) so the directional asymmetry creates the "cascade" feeling. Top-right reveals leftward, bottom-right rightward — alternating, like petals opening.

3. **Internal parallax (subtle).**
   - Inside each image, the `<img>`/`<Image>` is scaled at `1.08` and translated based on `scrollYProgress` of the section: `y: useTransform(scrollYProgress, [0, 1], [-40, 40])`. As the section scrolls past, the images drift in opposite directions — big image drifts up while right-column images drift down (or vice versa, pick the more cinematic). This gives 3D-without-3D feel.
   - Wrap each image in `overflow-hidden` so the parallax never bleeds outside the card.

4. **Studio-coming-soon caption.**
   - The dashed-border construction image's caption pill (`Studio space — coming soon`) animates separately: `opacity: 0 → 1` + `y: 12 → 0`, `delay: 1.0s` (after the image fully reveals). It feels like a "tag" placed onto the image after it lands.
   - Optional: a slow `1px` dashed-border march (`stroke-dashoffset` animation on an SVG border layer, 10s loop). Skip unless reviewer asks for it.

5. **Reduced motion.**
   - Skip all clip-path reveals — just `opacity: 0 → 1` over 0.4s for the whole grid. Skip parallax entirely.

---

## 7. SECTION 6 — Founding Membership (`FoundingMembershipSection.tsx`)

New section. Matches the second screenshot the user shared (dark card, centered content, dot progress, button, helper text).

### Layout
- Centered card on `bg-peach-200` page background. Card is `bg-warmDark-800 text-peach-200`.
- Card: `max-w-3xl mx-auto rounded-3xl px-8 py-14 md:px-16 md:py-20 text-center`.

### Content
- Eyebrow: `FOUNDING MEMBERSHIP` (`text-xs tracking-[0.3em] uppercase text-peach-400`).
- Headline: `Lock in your rate. For life.` (`font-display font-black text-3xl md:text-5xl text-peach-200 mt-4 leading-tight`).
- Body: `The first 25 members get founding pricing — locked in forever, no matter what rates become. Once they're gone, they're gone.` (`text-peach-400 text-base md:text-lg mt-4 max-w-xl mx-auto leading-relaxed`).
- Progress row: 10 dots inline + label.
  - 3 active dots (`bg-terra-400`), 7 inactive (`bg-peach-400/30`). Each dot `w-2.5 h-2.5 rounded-full`.
  - Label to the right: `25 spots · only a few left` (`text-sm text-peach-400`).
  - Use `flex items-center gap-2 justify-center mt-8`.
- CTA: `Join the waitlist` → routes to the interest form. **Use `/free-class` for now** unless an explicit waitlist route already exists (check `src/app/` — if there's a `/waitlist` or interest-form page, link to that instead). Button style: `inline-block bg-peach-200 text-warmDark-800 font-bold text-sm tracking-wider px-10 py-4 rounded-full hover:bg-peach-50 transition-colors mt-8`.
- Helper text under button: `No commitment. We'll share pricing details when you join.` (`text-xs text-peach-400/70 mt-4`).

### Constants
Pull the waitlist URL, the active-dots count, and the total-dots count into the `COPY` constants block so they're tunable:

```ts
const COPY = {
  eyebrow: "FOUNDING MEMBERSHIP",
  headline: "Lock in your rate. For life.",
  body: "The first 25 members get founding pricing — locked in forever, no matter what rates become. Once they're gone, they're gone.",
  spotsLabel: "25 spots · only a few left",
  ctaLabel: "Join the waitlist",
  ctaHref: "/free-class",            // TODO: swap to /waitlist once interest form route exists
  helper: "No commitment. We'll share pricing details when you join.",
  totalSpots: 10,                    // total dots rendered
  filledSpots: 3,                    // dots in terra-400
};
```

### Animation spec — Founding Membership

Signature motion: **dot-fill sequence (a "spots being claimed" feeling) + magnetic CTA**.

1. **Card entrance.**
   - The whole `bg-warmDark-800` card enters with `opacity: 0 → 1` + `y: 80 → 0` + `scale: 0.96 → 1`, `duration: 1.0s`, ease `EASE_OUT_EXPO`. Triggered on `whileInView` with `margin: "-20%"`.

2. **Internal content stagger.**
   - Eyebrow, headline, body, dot row, CTA, helper text each have `fadeUp` (24px) with `staggerChildren: 0.1s`, `delayChildren: 0.3s` (so the card lands first, then content settles in).
   - Headline uses the line-mask treatment (`y: 100% → 0%` inside `overflow-hidden`) instead of a normal fadeUp.

3. **Dot-fill sequence — the signature.**
   - All 10 dots start at the **inactive** color (`bg-peach-400/30`) with `scale: 0.7`, `opacity: 0`.
   - First, all 10 dots fade in with stagger `0.05s`, `duration: 0.4s`. They land at full opacity but inactive color, scale 1.
   - Then, after a `0.3s` pause, the first `filledSpots` (3) dots **transition to `bg-terra-400`** sequentially with another `0.12s` stagger, each one popping briefly (`scale: 1 → 1.25 → 1` over `0.35s`). It reads as "spots being claimed in real-time."
   - This is purely cosmetic — the number is hard-coded in `COPY` — but it makes the section feel alive.

4. **Spots label counter.**
   - Optional: the `25 spots · only a few left` label uses a tiny counter animation for the `25`. Animate from `15` → `25` over 1.2s using a `useMotionValue` + `useTransform`. Reads as urgency without being a literal countdown. Skip if it feels gimmicky in review.

5. **CTA button — magnetic hover.**
   - On `mousemove` within ~80px of the button, the button translates toward the cursor by ~10% of the cursor offset (`useMotionValue` + `useSpring`). On `mouseleave`, spring back to center.
   - Tutorial reference: standard "magnetic button" pattern. Don't go beyond ~10% — it gets clownish past that.
   - Disable entirely on touch devices (`@media (hover: hover)` gate).
   - On press: `scale: 1 → 0.97 → 1`, `duration: 0.15s`. Click feedback only.

6. **Ambient glow on the card.**
   - The card has a soft, slow-pulsing radial gradient behind it (`bg-terra-400/15` blurred at `blur-3xl`, sitting in a `-z-10` layer). Animate its `opacity: 0.4 → 0.7 → 0.4` over 6s, infinite. Subtle warmth, like a fireplace. Disable on reduced motion.

7. **Reduced motion.**
   - Skip dot-pop, counter, magnetic, and ambient glow. Use simple fade-in for the card. Filled dots render in their final color statically.

---

## 8. SECTION 7 — Instagram (`InstagramSection.tsx`)

Already exists inline in `page.tsx` as the "FOLLOW THE JOURNEY" strip. Extract it into its own file with the constants pattern.

### Changes
- Update the Instagram URL constant to **`https://instagram.com/solpilatesstudio.in`** (currently a placeholder `https://instagram.com/`).
- Update the visible handle text under the icon button from `sol.pilates` to **`@solpilatesstudio.in`**.
- Keep the existing copy:
  - Headline: `Follow the journey.` (sentence case — change from current `FOLLOW THE JOURNEY` all-caps).
  - Body: `Daily movement cues, behind-the-scenes from the studio, and stories from our community.`

```ts
const COPY = {
  headline: "Follow the journey.",
  body: "Daily movement cues, behind-the-scenes from the studio, and stories from our community.",
  handle: "@solpilatesstudio.in",
  url: "https://instagram.com/solpilatesstudio.in",
};
```

Section background `bg-peach-300`, padding `py-20`.

### Animation spec — Instagram

Signature motion: **two counter-scrolling marquee rows of post thumbnails** below the text.

1. **Header (headline + body) — standard reveal.**
   - Headline: line-mask reveal (`y: 100% → 0%`), `duration: 1.0s`, ease `EASE_OUT_EXPO`. Triggered on viewport entry.
   - Body: fadeUp (24px, 0.7s), `delay: 0.15s`.
   - Handle + Instagram icon button: fadeUp + scale (`0.9 → 1`), `delay: 0.3s`. The icon button gets a slow rotate on hover (`rotate: 0 → 8deg`, `duration: 0.4s`) — playful but contained.

2. **Two counter-scrolling marquee rows.**
   - Below the text block, render two horizontal rows of square Instagram post thumbnails (8-10 thumbs per row, duplicated for seamless loop).
   - Row 1 scrolls **left-to-right**, `duration: 80s`, linear, infinite.
   - Row 2 scrolls **right-to-left**, `duration: 80s`, linear, infinite. Slight `y` offset between rows so they read as overlapping bands.
   - Each thumbnail is `aspect-square`, `rounded-2xl` (or `rounded-none` if reviewer prefers sharp edges), `object-cover`, with a 2px gap.
   - On hover over a thumbnail: `scale: 1 → 1.05`, `duration: 0.3s`. Pause the row's marquee while hovering.
   - Image source: use placeholder Pilates/studio shots from `/public/images/instagram/` (TODO: replace with real IG-fed thumbs when an API integration ships — for now, hardcode 8 paths in a local `THUMBS` array).

3. **Click behavior.**
   - Whole marquee row is clickable — opens `COPY.url` in a new tab. Aria-label: `Open Instagram`.

4. **Reduced motion.**
   - Marquee rows freeze. Render the first 6 thumbnails in a static 3×2 grid instead.

---

## 9. SECTION 8 — Footer (`src/components/layout/Footer.tsx`)

Already exists. Edit the existing file — don't rewrite. Promote all editable strings to a `COPY` constant at the top of the file (same pattern as sections).

### Changes
1. **Tagline rewrite** (the paragraph under the logo, currently `"A sophisticated Pilates studio blending strength, mindfulness, and elegance..."`):
   - Replace with: `Contrology-based Pilates inside Tavaro Resorts, Hyderabad. Strength-led. Pain-free. Built to last.`
2. **Rename `COMPANY` column to `STUDIO`** (heading text only).
3. **Trim the STUDIO column** to exactly these four links, in this order:
   - `About Sol` → `/about`
   - `Sol Story` → `/founder`  (was "Our Story")
   - `Founder Story` → `/founder`  (was "Founder")
   - `Contact` → `/contact`
   - Remove `Our Instructors`.
4. **STAY CONNECTED block — update copy:**
   - Replace `Get updates on new classes, workshops, and studio events.` with:
     `Be the first to know about classes, founding member spots, and studio updates.`
   - Keep the email input + `Subscribe` button as-is.
5. **Instagram URL constant** at the top of the file: change `SOL_INSTAGRAM_URL` from `https://instagram.com/` to `https://instagram.com/solpilatesstudio.in`.

Do not change the grid structure, the logo block, the legal column, the bottom bar, or any styling outside of label text changes.

---

## 10. Things to delete

These exist in `page.tsx` today and have no home in the new design. Remove them entirely:

- The `SERVICES` array (lines 16–47) and the entire slider section (lines 309–407).
- The `STATS` array, `ProgressBar` component, `DecorativeIcon` component, and the entire `PERFORMANCE SECTION` (lines 481–543).
- All slider state: `expandedService`, `currentSlide`, `isSliderPaused`, `sliderTrackRef`, `sliderOffset`, `isDragging`, `dotCount`, `dragStartX`, the `getMaxSlide` / `nextSlide` / `prevSlide` / `handlePointerDown` / `handlePointerUp` handlers, and the slider auto-advance `useEffect`.
- `showScrollTop` state + scroll-to-top button (the layout's own header should handle this if needed; not part of this redesign).
- The `<FacilitiesSection />` import + render (replaced by `ClassTypesSection`). After the new section ships, delete `src/components/ui/facilities-cards.tsx`.

After this cleanup, `page.tsx` should be ~25 lines.

---

## 11. Acceptance checklist (tester + reviewer use this)

**Tester:**
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run build` succeeds.
- [ ] No console errors on `/`.
- [ ] Free-class popup still opens after 6s, dismisses to sessionStorage, routes to `/free-class`.
- [ ] Hero CTAs work: `Claim Your Free Class` → `/free-class`; `Get Started` → modal (if logged out) or dashboard (if logged in).
- [ ] Testimonials auto-scroll, pause on hover, resume on leave, loop at end.
- [ ] Testimonials with no `src` show a monogrammed circle (test by emptying one `src` locally).
- [ ] Instagram links open `https://instagram.com/solpilatesstudio.in` in a new tab.
- [ ] Footer links resolve to existing routes (`/about`, `/founder`, `/contact`).

**Reviewer (design):**
- [ ] All headlines are sentence case (not ALL CAPS) per the new brand voice.
- [ ] Each section file has a `STYLES` + `COPY` (+ `MEDIA`/`IMAGES` where relevant) block at the top, and no editable values are buried in JSX.
- [ ] Changing one section's background color requires editing exactly one line in that section's file.
- [ ] No section component reads styling from `page.tsx` or any parent.
- [ ] Tavaro section visually matches the reference (badge, headline, body, 1-big-2-small image grid).
- [ ] Founding membership card matches the dark reference (eyebrow, headline, body, dot row with label, pill CTA, helper text).
- [ ] Testimonial avatars are visibly smaller than the current build.
- [ ] No two cards in the "Why Sol" / "Class Types" sections look broken when an image is missing — placeholder gracefully covers the box.

**Frontend (self-check before handoff):**
- [ ] `src/app/page.tsx` is under 30 lines and contains zero inline data.
- [ ] No leftover imports for the deleted slider/performance/facilities code.
- [ ] All new images referenced from `MEDIA`/`IMAGES` constants have `TODO` comments next to paths that don't exist yet on disk.

**Animation acceptance (reviewer + tester — both check these):**
- [ ] `src/lib/animation/` exists with `easings.ts`, `variants.ts`, `useLenis.ts`, `useReveal.ts`. Easings export `EASE_OUT_EXPO = [0.22, 1, 0.36, 1]`.
- [ ] Lenis smooth scroll is wired in `src/app/layout.tsx` via a client component. Page scroll feels weighted, not native-snap.
- [ ] **Hero**: headline lines reveal via overflow-hidden mask (word-by-word or line-by-line, not character). Video has Ken Burns + scroll parallax. Overlay opacity ramps up with scroll.
- [ ] **Why Sol**: three cards stagger in with `0.14s` between them. Each image wipes top-down via clip-path mask.
- [ ] **Class Types (desktop)**: cards stack sticky as user scrolls — earlier cards scale down (≈0.92 by section end) and stay visible behind newer ones. Image inside each card parallax-drifts.
- [ ] **Class Types (mobile)**: falls back to vertical stagger fade-up. No sticky-stack at <768px.
- [ ] **Testimonials**: continuous marquee (no snap-scroll). Pauses on hover/touch. Scroll-velocity feeds into marquee speed.
- [ ] **Tavaro**: three images reveal in a diagonal cascade (mask). Internal parallax visible when scrolling past.
- [ ] **Founding Membership**: dots fade in sequentially, then first 3 "claim" with a pop-to-terra-400 sequence. CTA has magnetic hover on desktop.
- [ ] **Instagram**: two marquee rows scroll in opposite directions. Hover over a thumb pauses its row.
- [ ] **`prefers-reduced-motion: reduce`**: every section above falls back to a static or simple-fade variant. No infinite loops, no parallax, no marquee, no Lenis.
- [ ] Lighthouse CLS on `/` < 0.05. INP < 200ms.
- [ ] No animation runs on `width`, `height`, `top`, `left`, `margin`, `padding`, `filter`, `background-color`, or `box-shadow` (the shimmer + ambient glow are the only documented exceptions).
- [ ] All animation easings come from `easings.ts`. No ad-hoc cubic-beziers buried in JSX.
- [ ] No `aos`, no `react-reveal`, no `wow.js` added to `package.json`. GSAP usage is limited to (at most) the hero — grep `import.*gsap` should return ≤1 file.

---

## 12. Communication protocol (team rules)

- Frontend owns every file in this brief.
- If frontend needs a new route (e.g., a `/waitlist` page for the founding-membership CTA), **send a message to backend** before assuming. Don't invent routes.
- Frontend must **notify backend before adding `@studio-freight/lenis`** (or any other animation lib not already in `package.json`) so bundle-size impact is acknowledged.
- Tester runs the acceptance checks above and reports failures by file:line, not free-text. **Tester must record Lighthouse CLS + INP before/after** the redesign — animation regressions get caught here.
- Reviewer flags any vibe-coded styling (random color choices, ad-hoc spacing, inconsistent radii). Tier 1 flags block the merge. **Reviewer is also responsible for the "feel" check on animations** — if a section's signature motion doesn't read as premium or it competes with adjacent sections, flag it.
- No task is complete until tester AND reviewer sign off.

---

## 13. Animation reference library (for frontend agent — bookmark these)

The patterns called out above are well-documented. Frontend should skim these before starting:

- **Sticky scroll card stack** (Class Types section): https://blog.olivierlarose.com/tutorials/cards-parallax — definitive Framer Motion + Next.js implementation. Also https://motion.dev/tutorials/react-card-stack and https://skiper-ui.com/v1/skiper16 for variations.
- **Scroll-linked transforms with `useScroll` + `useTransform`**: https://motion.dev/docs/react-scroll-animations
- **Scroll-velocity marquee** (Testimonials + Instagram sections): standard `useVelocity` + `useSpring` pattern from Motion docs.
- **Text mask reveal** (Hero, every section headline): https://www.framer.com/blog/text-animations/ — section on "stagger reveal" and "mask reveal."
- **Magnetic button** (Founding Membership CTA): standard `useMotionValue` + `useSpring` pattern; many tutorials available. Don't overengineer — 10-15 lines of code.
- **Lenis smooth scroll**: https://github.com/darkroomengineering/lenis — wire it once at the root, then everything works.
- **Inspiration for "feel"**: scroll through https://www.awwwards.com/websites/landing-page/ for current premium-site reference; do not copy any single site wholesale.

Do not implement from training-data memory alone — pull these refs open before writing the scroll-linked sections.
