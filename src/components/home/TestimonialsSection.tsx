"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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
  body: "text-peach-400 mt-4 mx-auto",
  // Card
  card: "relative overflow-hidden bg-warmDark-700 border border-peach-200/10 p-7 md:p-8 flex h-[350px] md:h-[370px] flex-col w-[min(86vw,350px)] md:w-[360px] flex-shrink-0 snap-start",
  cardQuote:
    "relative z-10 text-peach-200 text-base leading-relaxed font-light line-clamp-[8]",
  cardMeta: "mt-auto flex items-center gap-3 pt-5",
  cardMark:
    "w-10 h-10 border border-terra-400/40 bg-terra-400/15 text-terra-300 flex items-center justify-center flex-shrink-0 font-display text-base font-extrabold leading-none",
  cardWatermark:
    "pointer-events-none absolute -right-5 -top-7 font-display text-[7rem] md:text-[8rem] font-extrabold leading-none text-terra-400/[0.045]",
  cardName: "text-peach-200 font-bold tracking-wide text-sm",
  cardRole: "text-terra-300 text-xs tracking-wider uppercase mt-0.5",
  arrow:
    "h-10 w-10 border border-peach-200/15 bg-warmDark-700/70 text-peach-200 inline-flex items-center justify-center transition hover:border-terra-400/60 hover:bg-terra-400 hover:text-warmDark-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-peach-200/15 disabled:hover:bg-warmDark-700/70 disabled:hover:text-peach-200",
  readMore:
    "relative z-10 mt-4 w-fit text-xs font-bold uppercase tracking-[0.2em] text-terra-300 transition hover:text-terra-200 cursor-pointer",
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

function cleanQuote(quote: string) {
  return quote.replace(/\s+/g, " ").trim();
}

// ── Testimonial card ────────────────────────────────────────

function TestimonialCard({
  item,
  onReadMore,
}: {
  item: Testimonial;
  onReadMore: (item: Testimonial) => void;
}) {
  const quote = cleanQuote(item.quote);
  const hasLongQuote = quote.length > 220;

  return (
    <article className={STYLES.card}>
      <span className={STYLES.cardWatermark} aria-hidden="true">
        ✦
      </span>
      <p className={STYLES.cardQuote}>{quote}</p>
      {hasLongQuote && (
        <button
          type="button"
          className={STYLES.readMore}
          onClick={() => onReadMore(item)}
        >
          Read full story
        </button>
      )}
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

function TestimonialStoryModal({
  item,
  onClose,
}: {
  item: Testimonial | null;
  onClose: () => void;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item || !isMounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-warmDark-900/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="testimonial-story-title"
      onClick={onClose}
    >
      <motion.div
        className="relative max-h-[82vh] w-full max-w-2xl overflow-y-auto bg-warmDark-700 p-7 text-peach-200 shadow-2xl md:p-9"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [...E] }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center border border-peach-200/15 text-peach-200 transition hover:border-terra-400/60 hover:bg-terra-400 hover:text-warmDark-900"
          aria-label="Close testimonial story"
          onClick={onClose}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-terra-300">
          Member Story
        </p>
        <h3
          id="testimonial-story-title"
          className="pr-12 font-display text-3xl font-black tracking-normal text-peach-200"
        >
          {item.name}
        </h3>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-terra-300">
          {item.role}
        </p>
        <p className="mt-7 whitespace-pre-line text-lg font-light leading-relaxed text-peach-200">
          {item.quote.trim()}
        </p>
      </motion.div>
    </div>,
    document.body
  );
}

// ── Manual carousel ─────────────────────────────────────────

function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(Math.max(items.length - 1, 0));
  const [step, setStep] = useState(0);
  const [selectedStory, setSelectedStory] = useState<Testimonial | null>(null);

  const syncMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const firstCard = track?.querySelector<HTMLElement>("article");
    if (!viewport || !track || !firstCard) return;

    const gap = parseFloat(window.getComputedStyle(track).columnGap || "0");
    const nextStep = firstCard.offsetWidth + gap;
    const visibleCards = Math.max(1, Math.floor((viewport.clientWidth + gap) / nextStep));
    const nextMax = Math.max(items.length - visibleCards, 0);

    setStep(nextStep);
    setMaxIndex(nextMax);
    setActiveIndex((index) => Math.min(index, nextMax));
  }, [items.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    syncMetrics();
    const observer = new ResizeObserver(syncMetrics);
    observer.observe(viewport);
    observer.observe(track);

    return () => observer.disconnect();
  }, [syncMetrics]);

  const moveTo = useCallback(
    (index: number) => {
      const nextIndex = Math.max(0, Math.min(index, maxIndex));
      setActiveIndex(nextIndex);
    },
    [maxIndex]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
      const threshold = Math.min(90, Math.max(45, step * 0.18));

      if (info.offset.x < -threshold) {
        moveTo(activeIndex + 1);
        return;
      }

      if (info.offset.x > threshold) {
        moveTo(activeIndex - 1);
      }
    },
    [activeIndex, moveTo, step]
  );

  const progress = maxIndex === 0 ? 100 : ((activeIndex + 1) / (maxIndex + 1)) * 100;

  return (
    <div className="relative isolate">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-warmDark-800 to-transparent md:w-12" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-warmDark-800 to-transparent md:w-12" />

      <div
        ref={viewportRef}
        className="overflow-hidden pb-2"
        role="region"
        aria-label="Testimonials carousel"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") moveTo(activeIndex - 1);
          if (event.key === "ArrowRight") moveTo(activeIndex + 1);
        }}
      >
        <motion.div
          ref={trackRef}
          className="flex gap-4 pr-[12vw] md:pr-[22vw]"
          animate={{ x: -activeIndex * step }}
          transition={{ duration: 0.55, ease: [...E] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          onDragEnd={handleDragEnd}
        >
          {items.map((item) => (
            <TestimonialCard
              key={item.name}
              item={item}
              onReadMore={setSelectedStory}
            />
          ))}
        </motion.div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <div
          className="h-px flex-1 overflow-hidden bg-peach-200/12"
          role="progressbar"
          aria-label="Testimonials progress"
          aria-valuemin={1}
          aria-valuemax={maxIndex + 1}
          aria-valuenow={activeIndex + 1}
        >
          <div
            className="h-full bg-terra-400 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={STYLES.arrow}
            aria-label="Previous testimonial"
            onClick={() => moveTo(activeIndex - 1)}
            disabled={activeIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={STYLES.arrow}
            aria-label="Next testimonial"
            onClick={() => moveTo(activeIndex + 1)}
            disabled={activeIndex === maxIndex}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <TestimonialStoryModal
        item={selectedStory}
        onClose={() => setSelectedStory(null)}
      />
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

        {/* Manual carousel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.9, delay: 0.2, ease: [...E] }}
          style={{ overflow: "hidden" }}
          className="relative isolate"
        >
          <TestimonialsCarousel items={TESTIMONIALS} />
        </motion.div>
      </div>
    </section>
  );
}
