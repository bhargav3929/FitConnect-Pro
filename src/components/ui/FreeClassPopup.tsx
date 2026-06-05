"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";

// ============================================================
//  FREE CLASS POPUP — edit this block to change anything visual
// ============================================================
const STYLES = {
  backdrop: "fixed inset-0 z-[80] bg-warmDark-800/60 backdrop-blur-sm",
  panel:
    "fixed left-1/2 top-1/2 z-[81] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-peach-100 p-8 md:p-10 shadow-2xl",
  closeBtn:
    "absolute top-4 right-4 text-olive-400 hover:text-terra-400 transition-colors",
  plus: "text-terra-400/70 text-2xl font-light block mb-2",
  headline:
    "font-display font-black text-3xl md:text-4xl text-olive-600 leading-[1.05]",
  body: "mt-5 text-olive-400 leading-relaxed",
  ctaRow: "mt-8 flex flex-col sm:flex-row gap-3",
  primaryBtn:
    "flex-1 px-6 py-4 bg-terra-400 text-peach-50 font-black text-xs tracking-widest uppercase text-center hover:bg-terra-300 transition-all shadow-glow",
  secondaryBtn:
    "px-6 py-4 text-olive-300 hover:text-terra-400 font-medium text-sm tracking-wider transition-colors",
};

const COPY = {
  headline: "Start with an intro class.",
  body: "Contrology-based Pilates inside Tavaro Resorts. Try an intro session — no commitment.",
  primaryCta: { label: "Book Your Intro Class", href: "/free-class" },
  secondaryLabel: "Maybe later",
};

const CONFIG = {
  storageKey: "sol_free_class_popup_dismissed",
  delayMs: 6000,
};

// ============================================================
//  Component
// ============================================================
export function FreeClassPopup({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(CONFIG.storageKey)) return;

    const t = setTimeout(() => setOpen(true), CONFIG.delayMs);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  const dismiss = () => {
    sessionStorage.setItem(CONFIG.storageKey, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={STYLES.backdrop}
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className={STYLES.panel}
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className={STYLES.closeBtn}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className={STYLES.headline}>{COPY.headline}</h2>
            <p className={STYLES.body}>{COPY.body}</p>

            <div className={STYLES.ctaRow}>
              <Link
                href={COPY.primaryCta.href}
                onClick={dismiss}
                className={STYLES.primaryBtn}
              >
                {COPY.primaryCta.label}
              </Link>
              <button onClick={dismiss} className={STYLES.secondaryBtn}>
                {COPY.secondaryLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
