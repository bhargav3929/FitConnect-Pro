"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
  useMotionValue,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";

// ============================================================
//  TESTIMONIALS SECTION — edit this block to change anything visual
// ============================================================
const STYLES = {
  section: "bg-warmDark-800 py-24 border-t border-peach-200/5 overflow-hidden",
  container: "container mx-auto px-6",
  headerWrap: "text-center mb-16",
  eyebrow:
    "text-terra-400/60 text-sm font-bold tracking-[0.3em] uppercase block mb-3",
  headline:
    "text-4xl md:text-5xl font-black text-peach-200 tracking-tighter inline-block font-display",
  body: "text-peach-400 mt-4 max-w-sm mx-auto",
  // Card
  card: "bg-warmDark-700 border border-peach-200/10 p-7 md:p-8 flex flex-col w-[340px] md:w-[400px] flex-shrink-0",
  cardQuote: "text-peach-200 text-base leading-relaxed font-light flex-1",
  cardMeta: "mt-6 flex items-center gap-3",
  cardAvatar:
    "w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-terra-400/40",
  cardAvatarMono:
    "w-10 h-10 rounded-full ring-1 ring-terra-400/40 bg-terra-400/20 flex items-center justify-center flex-shrink-0",
  cardName: "text-peach-200 font-bold tracking-wide text-sm",
  cardRole: "text-terra-300 text-xs tracking-wider uppercase mt-0.5",
};

const COPY = {
  eyebrow: "Success Stories",
  headline: "Testimonials",
  body: "Hear from our community about their transformative Pilates journey.",
};

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
  src?: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Srikanth Nomula",
    role: "Engineer",
    quote:
      "Swetha's personalized approach not only helped alleviate my back pain but also allowed me to spend more quality time with my daughter. Her positive energy and encouragement created a welcoming environment where I felt comfortable sharing my progress.",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "Pallavi Jalakam",
    role: "Engineer",
    quote:
      "After starting sessions with Swetha, I can do my yoga poses such as forward bends and back rolls with ease. Back rolls were impossible until lately.",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "Sushma Gurram",
    role: "Engineer",
    quote:
      "Since working with Swetha, my back has become more flexible and core and arm strength increased. I correct my sloppy posture when I'm sitting and moving. Swetha teaches through layers — we can pick whichever feels comfortable to us.",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "Melinda Hattan",
    role: "Pilates Studio Owner & Instructor",
    quote:
      "Swetha has great energy in the room. Her cueing is clear, direct, and somehow makes you realize muscles you didn't even know you had are working. She has a gift for helping clients dial in their form.",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "Sai Shruthi Sayini",
    role: "Pilates Instructor",
    quote:
      "My back pain is gone, I've built so much more muscle, and I feel genuinely confident in my body again. Her classes feel special, smooth, flowy with minimal transitions and you can feel the effort she puts into every session.",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "Kanthisri",
    role: "Medical Coder",
    quote:
      "My stamina has noticeably improved. What I appreciate most is the curated approach she brings. She's patient, professional and genuinely invested in her clients' progress.",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "Shelli",
    role: "Operations Manager",
    quote:
      "I have more confidence and better balance in my daily life. Swetha leads focused, challenging classes with a calm, clear energy that keeps you motivated throughout.",
    src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "Abhinav",
    role: "Software Engineer",
    quote:
      "After completing her online back pain course twice consistently, 70–80% of my pain is gone and I feel significantly better. My one piece of advice: stick with it consistently and you will see the results.",
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
  },
];

const E: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Wraps a continuously-decreasing value to the range [min, max)
function wrapValue(min: number, max: number, v: number): number {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

// ── Testimonial card ────────────────────────────────────────

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <article className={STYLES.card}>
      <p className={STYLES.cardQuote}>&ldquo;{item.quote}&rdquo;</p>
      <div className={STYLES.cardMeta}>
        {item.src ? (
          <div className={STYLES.cardAvatar}>
            <Image
              src={item.src}
              alt={item.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className={STYLES.cardAvatarMono}>
            <span className="text-terra-400 font-bold text-sm">
              {item.name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className={STYLES.cardName}>{item.name}</p>
          <p className={STYLES.cardRole}>{item.role}</p>
        </div>
      </div>
    </article>
  );
}

// ── Velocity-linked marquee ─────────────────────────────────

function TestimonialsMarquee({ items }: { items: Testimonial[] }) {
  const x = useMotionValue(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const [halfWidth, setHalfWidth] = useState(0);
  const [paused, setPaused] = useState(false);

  // Measure strip after mount
  useEffect(() => {
    if (stripRef.current) {
      setHalfWidth(stripRef.current.scrollWidth / 2);
    }
  }, []);

  // Scroll velocity → marquee speed boost
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [-3000, 3000], [-3, 3]);

  useAnimationFrame((_, delta) => {
    if (paused || halfWidth === 0) return;
    const baseSpeed = 80; // px per second
    const boost = Math.max(-45, Math.min(45, velocityFactor.get() * 15));
    const move = -(baseSpeed + boost) * (delta / 1000);
    x.set(wrapValue(-halfWidth, 0, x.get() + move));
  });

  // Duplicate items for seamless loop
  const all = [...items, ...items];

  return (
    <div
      className="overflow-hidden w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <motion.div ref={stripRef} className="flex gap-4" style={{ x }}>
        {all.map((item, i) => (
          <TestimonialCard key={i} item={item} />
        ))}
      </motion.div>
    </div>
  );
}

// ── Reduced-motion fallback: static 2-col grid ──────────────

function TestimonialsGrid({ items }: { items: Testimonial[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.slice(0, 6).map((item) => (
        <TestimonialCard key={item.name} item={item} />
      ))}
    </div>
  );
}

// ============================================================
//  Component
// ============================================================
export function TestimonialsSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className={STYLES.section}>
      <div className={STYLES.container}>
        {/* Header */}
        <div className={STYLES.headerWrap}>
          <motion.span
            className={STYLES.eyebrow}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.6, ease: [...E] }}
          >
            {COPY.eyebrow}
          </motion.span>
          <div className="overflow-hidden">
            <motion.h2
              className={STYLES.headline}
              initial={prefersReduced ? undefined : { y: "100%" }}
              whileInView={{ y: "0%" }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.9, delay: 0.1, ease: [...E] }}
            >
              {COPY.headline}
            </motion.h2>
          </div>
          <motion.p
            className={STYLES.body}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.7, delay: 0.2, ease: [...E] }}
          >
            {COPY.body}
          </motion.p>
        </div>

        {/* Marquee or static grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.9, delay: 0.2, ease: [...E] }}
        >
          {prefersReduced ? (
            <TestimonialsGrid items={TESTIMONIALS} />
          ) : (
            <TestimonialsMarquee items={TESTIMONIALS} />
          )}
        </motion.div>
      </div>
    </section>
  );
}
