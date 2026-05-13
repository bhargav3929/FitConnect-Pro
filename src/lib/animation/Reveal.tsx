"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MotionProps } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import { reducedFade, variantsMap } from "./variants";
import type { RevealVariant } from "./variants";

export type RevealProps = {
  children: ReactNode;
  variant?: RevealVariant;
  as?: ElementType;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number | "some" | "all";
  margin?: string;
  className?: string;
  style?: React.CSSProperties;
} & Omit<MotionProps, "variants" | "initial" | "whileInView" | "viewport">;

export function Reveal({
  children,
  variant = "slideUp",
  as,
  delay,
  duration,
  once = true,
  amount = "some",
  margin = "-15% 0px",
  className,
  style,
  ...rest
}: RevealProps) {
  const prefersReduced = useReducedMotion();
  const activeVariants = prefersReduced ? reducedFade : variantsMap[variant];

  const Component = useMemo(() => motion(as ?? "div"), [as]);

  const transitionOverride =
    !prefersReduced && (delay !== undefined || duration !== undefined)
      ? { delay, duration }
      : undefined;

  return (
    <Component
      variants={activeVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin }}
      className={className}
      style={style}
      transition={transitionOverride}
      {...rest}
    >
      {children}
    </Component>
  );
}

export type RevealGroupProps = {
  children: ReactNode;
  as?: ElementType;
  staggerChildren?: number;
  delayChildren?: number;
  once?: boolean;
  amount?: number | "some" | "all";
  margin?: string;
  className?: string;
  style?: React.CSSProperties;
} & Omit<MotionProps, "variants" | "initial" | "whileInView" | "viewport">;

export function RevealGroup({
  children,
  as,
  staggerChildren,
  delayChildren,
  once = true,
  amount = "some",
  margin = "-15% 0px",
  className,
  style,
  ...rest
}: RevealGroupProps) {
  const prefersReduced = useReducedMotion();

  const groupVariants = prefersReduced
    ? { hidden: {}, visible: {} }
    : {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerChildren ?? 0.1,
            delayChildren: delayChildren ?? 0.05,
          },
        },
      };

  const Component = useMemo(() => motion(as ?? "div"), [as]);

  return (
    <Component
      variants={groupVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin }}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
}
