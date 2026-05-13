import type { Variants, Transition } from "framer-motion";

export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
export const EASE_OVERSHOOT = [0.34, 1.56, 0.64, 1] as const;
export const DUR_FAST = 0.5;
export const DUR_BASE = 0.7;
export const DUR_SLOW = 0.9;
export const STAGGER = 0.1;
export const STAGGER_DELAY = 0.05;

// Cast to mutable tuple so TypeScript accepts it as BezierDefinition
const baseTransition: Transition = {
  duration: DUR_BASE,
  ease: [...EASE_OUT_QUINT] as [number, number, number, number],
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { ...baseTransition, duration: DUR_FAST } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: baseTransition },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: baseTransition },
};

export const shapeIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: baseTransition },
};

export const revealIn: Variants = {
  hidden: { opacity: 0, clipPath: "inset(100% 0% 0% 0%)" },
  visible: {
    opacity: 1,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: { ...baseTransition, duration: DUR_SLOW },
  },
};

export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER, delayChildren: STAGGER_DELAY },
  },
};

export const reducedFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
};

export const variantsMap = {
  fadeIn,
  slideUp,
  slideRight,
  slideLeft,
  shapeIn,
  revealIn,
  stagger,
} as const;

export type RevealVariant = keyof typeof variantsMap;
