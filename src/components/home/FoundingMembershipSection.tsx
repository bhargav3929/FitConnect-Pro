"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { WaitlistModal } from "@/components/ui/WaitlistModal";

// ============================================================
//  FOUNDING MEMBERSHIP SECTION — edit this block to change anything visual
// ============================================================
const COPY = {
  eyebrow: "FOUNDING MEMBERSHIP",
  headline: "Lock in your rate. For life.",
  body: "The first 25 members get founding pricing — locked in forever, no matter what rates become. Once they're gone, they're gone.",
  spotsLabel: "25 spots · only a few left",
  ctaLabel: "Join the waitlist",
  ctaHref: "/intro-class", // TODO: swap to /waitlist once interest form route exists
  helper: "No commitment. We'll share pricing details when you join.",
  totalSpots: 10,
  filledSpots: 3,
};

// terra-400 = SOL primary coral
const TERRA_COLOR = "#FF6A3D";
const INACTIVE_COLOR = "rgba(212,180,148,0.3)";

const E: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Magnetic CTA ────────────────────────────────────────────

function MagneticCTA({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { damping: 20, stiffness: 200 });
  const y = useSpring(rawY, { damping: 20, stiffness: 200 });

  function onMove(e: React.MouseEvent) {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rawX.set((e.clientX - cx) * 0.1);
    rawY.set((e.clientY - cy) * 0.1);
  }

  function onLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={disabled ? {} : { x, y }}
      whileTap={{ scale: 0.97 }}
      className="inline-block bg-peach-200 text-warmDark-800 font-bold text-sm tracking-wider px-10 py-4 rounded-full hover:bg-peach-50 transition-colors mt-8"
    >
      {label}
    </motion.button>
  );
}

// ── Dot row with two-phase animation ────────────────────────

function DotRow() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const prefersReduced = useReducedMotion();

  // Phase 0: dots invisible
  // Phase 1: all dots fade in as inactive
  // Phase 2: first filledSpots dots pop to terra color
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    if (!isInView || prefersReduced) return;
    // Start fade-in after card enters (300ms)
    const t1 = setTimeout(() => setPhase(1), 300);
    // All dots take: stagger 0.06s × 10 + 0.4s duration = 1.0s; + 300ms pause
    const t2 = setTimeout(() => setPhase(2), 300 + 1000 + 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isInView, prefersReduced]);

  // Reduced motion: show dots immediately in final state
  useEffect(() => {
    if (!prefersReduced || !isInView) return;
    const frame = requestAnimationFrame(() => setPhase(2));
    return () => cancelAnimationFrame(frame);
  }, [prefersReduced, isInView]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-2 justify-center mt-8"
    >
      {Array.from({ length: COPY.totalSpots }).map((_, i) => {
        const isFilled = i < COPY.filledSpots;
        const isActive = phase === 2 && isFilled;
        const isVisible = phase >= 1;

        return (
          <motion.span
            key={i}
            animate={
              isActive
                ? {
                    opacity: 1,
                    scale: [1, 1.25, 1],
                    backgroundColor: TERRA_COLOR,
                  }
                : isVisible
                ? { opacity: 1, scale: 1, backgroundColor: INACTIVE_COLOR }
                : { opacity: 0, scale: 0.7, backgroundColor: INACTIVE_COLOR }
            }
            transition={
              isActive
                ? {
                    delay: i * 0.12,
                    duration: 0.35,
                    ease: [...E],
                    backgroundColor: { duration: 0.2 },
                    scale: { duration: 0.35, times: [0, 0.5, 1] },
                  }
                : {
                    delay: i * 0.06,
                    duration: 0.4,
                    ease: "easeOut",
                  }
            }
            className="w-2.5 h-2.5 rounded-full inline-block"
          />
        );
      })}
      <motion.span
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="text-sm text-peach-400 ml-2"
      >
        {COPY.spotsLabel}
      </motion.span>
    </div>
  );
}

// ============================================================
//  Component
// ============================================================
export function FoundingMembershipSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-20%" });
  const prefersReduced = useReducedMotion();
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <>
    <section className="bg-peach-200 py-24 md:py-32">
      <div className="container mx-auto px-8">
        {/* Ambient glow behind card */}
        <div className="relative max-w-3xl mx-auto">
          {!prefersReduced && (
            <motion.div
              className="absolute inset-0 -z-10 blur-3xl rounded-3xl bg-terra-400/15"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
          )}

          {/* Card entrance: fade + rise + scale */}
          <motion.div
            ref={cardRef}
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, y: 80, scale: 0.96 }
            }
            animate={
              isInView
                ? { opacity: 1, y: 0, scale: 1 }
                : prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, y: 80, scale: 0.96 }
            }
            transition={{ duration: 1.0, ease: [...E] }}
            className="bg-warmDark-800 rounded-3xl px-8 py-14 md:px-16 md:py-20 text-center"
          >
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4, ease: [...E] }}
              className="text-xs tracking-[0.3em] uppercase text-peach-400"
            >
              {COPY.eyebrow}
            </motion.p>

            {/* Headline — line-mask */}
            <div className="overflow-hidden mt-4">
              <motion.h2
                initial={prefersReduced ? { opacity: 0 } : { y: "100%" }}
                animate={isInView ? { y: "0%", opacity: 1 } : {}}
                transition={{ duration: 1.0, delay: 0.5, ease: [...E] }}
                className="font-display font-black text-3xl md:text-5xl text-peach-200 leading-tight"
              >
                {COPY.headline}
              </motion.h2>
            </div>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.65, ease: [...E] }}
              className="text-peach-400 text-base md:text-lg mt-6 max-w-xl mx-auto leading-relaxed"
            >
              {COPY.body}
            </motion.p>

            {/* Dot fill sequence */}
            <DotRow />

            {/* Magnetic CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.9, ease: [...E] }}
              className="flex justify-center"
            >
              <MagneticCTA
                onClick={() => setShowWaitlist(true)}
                label={COPY.ctaLabel}
                disabled={!!prefersReduced}
              />
            </motion.div>

            {/* Helper text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="text-xs text-peach-400/70 mt-4"
            >
              {COPY.helper}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>

    <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
  </>
  );
}
