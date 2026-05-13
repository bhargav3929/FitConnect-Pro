"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
  src?: string;
};

const TERRA_400 = "#C2714A";
const PEACH_200_20 = "rgba(255,232,210,0.2)";

const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = useState(false);

  const paginate = (dir: 1 | -1) => {
    setPage(([i]) => [(i + dir + items.length) % items.length, dir]);
  };

  useEffect(() => {
    if (isPaused) return;
    const t = setTimeout(() => paginate(1), 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isPaused]);

  const t = items[index];

  return (
    <div
      className="w-full max-w-3xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative overflow-hidden min-h-[520px] md:min-h-[420px]">
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.article
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full bg-warmDark-700 border border-peach-200/10 p-8 md:p-10 flex flex-col absolute inset-0"
          >
            <p className="text-peach-200 text-lg md:text-xl leading-relaxed font-light flex-1">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-8 flex items-center gap-4">
              {t.src ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-terra-400/40">
                  <Image src={t.src} alt={t.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full ring-1 ring-terra-400/40 bg-terra-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-terra-400 font-bold text-sm">{t.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <motion.div
                  key={`stars-${index}`}
                  className="flex gap-0.5 mb-1"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
                    hidden: {},
                  }}
                >
                  {[0, 1, 2, 3, 4].map((s) => (
                    <motion.span
                      key={s}
                      variants={{
                        hidden: { opacity: 0, scale: 0.5 },
                        visible: { opacity: 1, scale: 1 },
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="text-terra-400 text-xs"
                    >
                      ★
                    </motion.span>
                  ))}
                </motion.div>
                <p className="text-peach-200 font-bold tracking-wide text-sm">{t.name}</p>
                <p className="text-terra-300 text-xs tracking-wider uppercase mt-0.5">{t.role}</p>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-peach-200/10">
        <div className="flex gap-1.5">
          {items.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setPage([i, i > index ? 1 : -1])}
              aria-label={`Go to testimonial ${i + 1}`}
              animate={{
                width: i === index ? 24 : 8,
                backgroundColor: i === index ? TERRA_400 : PEACH_200_20,
              }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => paginate(-1)}
            aria-label="Previous testimonial"
            className="w-11 h-11 rounded-full border border-peach-200/20 text-peach-200 hover:bg-terra-400 hover:border-terra-400 hover:text-peach-50 transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => paginate(1)}
            aria-label="Next testimonial"
            className="w-11 h-11 rounded-full border border-peach-200/20 text-peach-200 hover:bg-terra-400 hover:border-terra-400 hover:text-peach-50 transition-all flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
