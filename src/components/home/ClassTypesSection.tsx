"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { Reveal } from "@/lib/animation/Reveal";

// ============================================================
//  CLASS TYPES SECTION — edit this block to change anything visual
// ============================================================
const STYLES = {
  section: "bg-peach-100",
  headerWrap: "container mx-auto px-6 pt-24 pb-0 md:pt-32 md:pb-0",
  headline: "font-display font-black text-4xl md:text-6xl text-olive-600",
  // Desktop sticky card
  stickyCard:
    "w-[92vw] max-w-5xl mx-auto bg-peach-200 grid grid-cols-1 md:grid-cols-[55fr_45fr] overflow-hidden shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.25)]",
  stickyImageWrap: "relative h-[50vh] md:h-[72vh] overflow-hidden bg-peach-300",
  stickyTextWrap:
    "flex flex-col justify-center px-8 py-10 md:px-12 md:py-16",
  // Mobile grid
  mobileGrid: "container mx-auto px-6 py-24 grid grid-cols-1 gap-8",
  mobileImageWrap: "relative aspect-[3/4] w-full overflow-hidden rounded-none",
  // Shared
  statusPill:
    "inline-block text-[10px] tracking-[0.25em] uppercase text-terra-400 border border-terra-400/40 px-3 py-1 mb-4",
  cardName: "font-display font-bold text-2xl md:text-3xl text-olive-600",
  cardBody: "text-olive-400 text-base leading-relaxed mt-2",
  cardImagePlaceholder: "absolute inset-0 bg-peach-300",
  cardImage: "object-cover",
};

const COPY = {
  headline: "One studio, three ways to move.",
};

const CLASSES = [
  {
    name: "Sol Flow",
    status: null as string | null,
    body: "Strength meets movement in one seamless sequence. No breaks, no rush. Just continuous work that builds your body and clears your mind.",
    image: "/images/classes/sol-flow.jpg",
    alt: "Long stretch on reformer",
  },
  {
    name: "Sol Cardio",
    status: "Coming soon" as string | null,
    body: "High-energy reformer sequences that build endurance and leave you breathless (in the best way).",
    image: "/images/classes/sol-cardio.jpg",
    alt: "Jumpboard cardio sequence",
  },
  {
    name: "Sol Stretch",
    status: "Coming soon" as string | null,
    body: "Your body's reset button. Long, intentional stretches that undo tension and restore the way you were meant to move.",
    image: "/images/classes/sol-stretch.jpg",
    alt: "Mermaid stretch",
  },
];

const E: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── hooks ─────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return isMobile;
}

// ── Sticky card sub-component ──────────────────────────────
// Key architectural rule:
//   - The sticky wrapper is a plain <div> (no transform on it — CSS sticky + transform conflict)
//   - The scale transform lives on the inner <motion.div> only
//   - All cards share top: 0 so they stack at the same vertical position

type ClassItem = (typeof CLASSES)[0];

function StickyCard({
  cls,
  index,
  total,
  scrollYProgress,
}: {
  cls: ClassItem;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const isLast = index === total - 1;

  // Each card "owns" its 1/total slice of the scroll range
  const slotStart = index / total;
  const slotEnd = (index + 1) / total;

  // Scale down during this card's slot; last card stays at 1
  // 0.07 per step = 14% shrink for card 0, 7% for card 1 — clearly visible
  const finalScale = isLast ? 1.0 : 1 - (total - 1 - index) * 0.07;
  const scale = useTransform(scrollYProgress, [slotStart, slotEnd], [1.0, finalScale]);

  // Image drifts slightly as card is being pushed back
  const imageY = useTransform(scrollYProgress, [slotStart, slotEnd], ["0%", "-6%"]);

  return (
    // Plain div owns the sticky positioning — NO transform here
    <div
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        zIndex: index + 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* motion.div owns the scale — separate from sticky element */}
      <motion.div style={{ scale }} className={STYLES.stickyCard}>
        {/* Image */}
        <div className={STYLES.stickyImageWrap}>
          <div className={STYLES.cardImagePlaceholder} aria-hidden="true" />
          <motion.div className="absolute inset-0" style={{ y: imageY }}>
            <Image
              src={cls.image}
              alt={cls.alt}
              fill
              className={STYLES.cardImage}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </motion.div>
        </div>

        {/* Text */}
        <div className={STYLES.stickyTextWrap}>
          {cls.status && (
            <div className="relative overflow-hidden inline-block self-start mb-1">
              <span className={STYLES.statusPill}>{cls.status}</span>
              <span
                className="shimmer-pill absolute inset-0 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          )}
          <h3 className={STYLES.cardName}>{cls.name}</h3>
          <p className={STYLES.cardBody}>{cls.body}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Mobile card ────────────────────────────────────────────

function MobileCard({ cls }: { cls: ClassItem }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0, transition: { duration: 1.0, ease: [...E] } },
      }}
    >
      <div className={STYLES.mobileImageWrap}>
        <div className={STYLES.cardImagePlaceholder} aria-hidden="true" />
        <motion.div
          className="absolute inset-0"
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Image
            src={cls.image}
            alt={cls.alt}
            fill
            className={STYLES.cardImage}
            sizes="100vw"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <h3 className={STYLES.cardName}>{cls.name}</h3>
        {cls.status && (
          <div className="relative overflow-hidden">
            <span className={STYLES.statusPill}>{cls.status}</span>
            <span
              className="shimmer-pill absolute inset-0 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      <p className={STYLES.cardBody}>{cls.body}</p>
    </motion.div>
  );
}

// ── Desktop sticky stack ───────────────────────────────────

function DesktopStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={containerRef}
      style={{ height: `${CLASSES.length * 100}vh` }}
      className="relative"
    >
      {CLASSES.map((cls, i) => (
        <StickyCard
          key={cls.name}
          cls={cls}
          index={i}
          total={CLASSES.length}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </div>
  );
}

// ============================================================
//  Component
// ============================================================
export function ClassTypesSection() {
  const isMobile = useIsMobile();
  const prefersReduced = useReducedMotion();

  const useSimpleLayout = isMobile || !!prefersReduced;

  return (
    <section className={STYLES.section}>
      {/* Section headline */}
      <div className={STYLES.headerWrap}>
        <div className="overflow-hidden pb-16 md:pb-20">
          <motion.h2
            className={STYLES.headline}
            initial={{ y: "100%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1.0, ease: [...E] }}
          >
            {COPY.headline}
          </motion.h2>
        </div>
      </div>

      {useSimpleLayout ? (
        <motion.div
          className={STYLES.mobileGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-20%" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
          }}
        >
          {CLASSES.map((cls) => (
            <MobileCard key={cls.name} cls={cls} />
          ))}
        </motion.div>
      ) : (
        <DesktopStack />
      )}
    </section>
  );
}
