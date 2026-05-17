"use client";

import { useRef, useState, useEffect } from "react";
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
    "text-4xl md:text-5xl font-black text-peach-200 tracking-normal inline-block font-display",
  body: "text-peach-400 mt-4 max-w-sm mx-auto",
  // Card
  card: "relative overflow-hidden bg-warmDark-700 border border-peach-200/10 p-7 md:p-8 flex flex-col w-[340px] md:w-[400px] flex-shrink-0",
  cardQuote: "text-peach-200 text-base leading-relaxed font-light flex-1",
  cardMeta: "mt-6 flex items-center gap-3",
  cardMark:
    "w-10 h-10 border border-terra-400/40 bg-terra-400/15 text-terra-300 flex items-center justify-center flex-shrink-0 font-display text-base font-extrabold leading-none",
  cardWatermark:
    "pointer-events-none absolute -right-5 -top-7 font-display text-[7rem] md:text-[8rem] font-extrabold leading-none text-terra-400/[0.045]",
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
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Srikanth Nomula",
    role: "Engineer",
    quote:
      `I was not able to spend much time with my daughter or do activities because of back pain. With Swetha’’s personalized approach, It not only helped alleviate my back pain but also allowed me to spend more quality time with my daughter. I felt more energetic and capable of participating in her activities. Another fantastic outcome was my improved performance in volleyball. 
Swetha’s positive energy and encouragement not only motivated me to push through the tough workouts but also created a welcoming environment where I felt comfortable sharing my progress and challenges.
`,
  },
  {
    name: "Pallavi Jalakam",
    role: "Engineer",
    quote:
      "I was struggling with lower back pain while bending and was not able to stretch completely during yoga poses. After starting my sessions with Swetha, I can do my yoga poses such as forward bends and back rolls with ease. Back rolls were impossible until lately.",
  },
  {
    name: "Sushma Gurram",
    role: "Engineer",
    quote:
      `Because of my back pain, I become restless with my toddler and pain adds to make the already cranky situation worse. Since working with Swetha, my back has become more flexible and core and arm strength increased. I correct my sloppy posture when I’m sitting and moving. I also realized how I can use exercise bands for getting stronger almost anywhere anytime just sitting on the couch. 
Swetha teaches through layers in her classes and we can pick whichever feels comfortable to us, so that we feel a sense of progress of where we stand in terms of strength and flexibility doing those layers of any movement. `,
  },
  {
    name: "Melinda Hattan",
    role: "Pilates Studio Owner & Instructor",
    quote:
      `Swetha has great energy in the room. She is passionate about movement and it shows (in the best way). Her cueing is clear, direct, and somehow makes you realize muscles you didn’t even know you had… are definitely working. She has a gift for helping clients dial in their form while building that all-important mind-body connection.
Beyond that, Swetha brings such a warm, welcoming energy to the studio. She connects easily with members, remembers the little things, and makes everyone feel comfortable (even mid-shaky-shaky on the reformer). 
I'd especially recommend her to anyone on a postpartum or prenatal journey.`,
  },
  {
    name: "Sai Shruthi Sayini",
    role: "Pilates Instructor",
    quote:
      `I tried Pilates after trying everything to heal my sciatica pain. After a lot of research, I decided to give Pilates one last shot and it worked. My back pain is gone, I've built so much more muscle, and I feel genuinely confident in my body again. What stands out most about Swetha's classes is how warm and intentional she is. Her classes feel special, smooth, flowy with minimal transitions and you can feel the effort she puts into every session. I'd recommend her to anyone without hesitation. Try her classes and feel the difference for yourself.`,
  },
  {
    name: "Kanthisri",
    role: "Medical Coder",
    quote:
      `I came to Pilates already doing yoga and walking but I wanted to add real strength training. Swetha delivered exactly that, my stamina has noticeably improved. What I appreciate most is the curated approach she brings, both in class and in the practice videos she provides. She's patient, professional and genuinely invested in her clients' progress. If you're looking for interactive, results-driven Pilates sessions, Swetha is the place to go.`,
  },
  {
    name: "Shelli",
    role: "Operations Manager",
    quote:
      `I started with concerns about my strength, flexibility, and balance and Pilates addressed every one of them. I have more confidence and better balance in my daily life. Swetha leads focused, challenging classes with a calm, clear energy that keeps you motivated throughout. I'd recommend her to anyone looking to feel stronger and more capable in their everyday movement.`,
  },
  {
    name: "Abhinav",
    role: "Software Engineer",
    quote:
      `I came to Swetha dealing with sciatica and severe lower back pain. After completing her online back pain course twice consistently, I'd say 70–80% of my pain is gone and I feel significantly better. Her instruction is clear, precise and easy to follow, which made all the difference in staying consistent. I've already recommended her to friends and family dealing with similar issues and I'll keep doing so. My one piece of advice: stick with it consistently, exactly as she instructs and you will see the results.`,
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
      <span className={STYLES.cardWatermark} aria-hidden="true">
        ✦
      </span>
      <p className={STYLES.cardQuote}>{item.quote}</p>
      <div className={STYLES.cardMeta}>
        <div className={STYLES.cardMark} aria-hidden="true">
          ✦
        </div>
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
    const frame = requestAnimationFrame(() => {
      if (stripRef.current) {
        setHalfWidth(stripRef.current.scrollWidth / 2);
      }
    });

    return () => cancelAnimationFrame(frame);
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
      className="overflow-hidden w-full isolate"
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
          style={{ overflow: "hidden" }}
          className="relative isolate"
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
