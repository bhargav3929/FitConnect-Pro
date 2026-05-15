"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-peach-200">
      {/* Hero */}
      <section className="relative pt-40 pb-20 bg-warmDark-800 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <span className="text-[20vw] font-black text-peach-200 whitespace-nowrap font-display">ABOUT</span>
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-peach-200 tracking-normal font-display">
              ABOUT SOL
            </h1>
          </motion.div>
        </div>
      </section>

      {/* The Name — Sol */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <div className="border border-terra-400/30 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-terra-400 bg-terra-400/10 mb-6 inline-block">
                The Name
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-normal mb-6 font-display">
                WHY &ldquo;SOL&rdquo;?
              </h2>
              <p className="text-olive-400 text-lg leading-relaxed max-w-2xl mx-auto">
                &ldquo;Sol&rdquo; means <strong className="text-olive-600">sun</strong> in many languages. The sun nurtures and sustains life — and that&apos;s exactly what our studio does for the body. SOL Pilates embodies warmth, energy, and a radiant approach to health through disciplined, precise movement.
              </p>
            </motion.div>

            {/* Visual divider with logo */}
            {/* <div className="flex items-center justify-center gap-6 my-16">
              <div className="h-px bg-peach-400 flex-1" />
              <Image
                src="/images/sol-logo-terra.png"
                alt="SOL"
                width={200}
                height={200}
                className="h-20 w-auto opacity-60"
              />
              <div className="h-px bg-peach-400 flex-1" />
            </div> */}
          </div>
        </div>
      </section>

      {/* Bio — Your body is the SUN */}
      {/* <section className="py-24 bg-peach-300">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-10"
            >
              <div className="border border-terra-400/30 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-terra-400 bg-terra-400/10 mb-6 inline-block">
                Our Bio
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-normal mb-8 font-display">
                YOUR BODY IS THE SUN
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-5 text-olive-400 leading-relaxed text-lg"
            >
              <p>
                At Sol Pilates Studio, we believe your body is the SUN your life revolves around.
              </p>
              <p>
                When it&rsquo;s in pain, everything feels heavier. When it&rsquo;s strong, everything feels possible.
              </p>
              <p>
                That&rsquo;s why we built a method rooted in three things: strength, intention and sustainability. We combine Pilates with strength training principles and a rehab mindset. So you&rsquo;re not just working out, you&rsquo;re moving out of pain and into a better quality of life.
              </p>
              <p>
                No extremes. No quick fixes. Just intentional movement that helps you stand taller, move freer and feel at home in your body again.
              </p>
              <p className="text-olive-600 font-semibold">
                Because when your sol is strong, your whole life gets lighter.
              </p>
            </motion.div>
          </div>
        </div>
      </section> */}

      {/* Brand Essence */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="border border-terra-400/30 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-terra-400 bg-terra-400/10 mb-6 inline-block">
                The Sol Philosophy
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-normal mb-6 font-display">
                TRUE STRENGTH COMES FROM WITHIN
              </h2>
              <div className="space-y-5 text-olive-400 leading-relaxed">
                <p>
                  SOL Pilates Studio is a professional movement studio rooted in the belief that true strength comes from within.
                </p>
                <p>
                  Our studio represents a modern approach to a classical discipline. We believe in controlled, intentional movement — building strength, flexibility, and mental clarity from the inside out.
                </p>
                <p>
                  Inspired by the sun (&ldquo;Sol&rdquo; in many languages), the studio embodies warmth, energy, and a radiant approach to health. Just as the sun nurtures and sustains life, SOL Pilates nurtures the body through disciplined, precise movement.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative h-[500px] overflow-hidden">
                <Image
                  src="/images/sol-pilates-mat-olive.jpeg"
                  alt="SOL Pilates Studio"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warmDark-800/30 to-transparent" />
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border-2 border-terra-400/20 -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

       {/* Founder Story */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div              
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-10"
            >
              <div className="border border-terra-400/30 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-terra-400 bg-terra-400/10 mb-6 inline-block">
                Founder Story
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-normal mb-8 font-display">
                FROM ENGINEERING TO MOVEMENT
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-5 text-olive-400 leading-relaxed text-lg"
            >
              <p>
                I didn&rsquo;t come from a traditional fitness background; I came from engineering.
              </p>
              <p>
                With a Master&rsquo;s in Electrical Engineering and years spent in high-performance environments, I&rsquo;ve always approached problems the same way: understand the system deeply before trying to fix it.
              </p>
              <p>
                Over time, I started seeing the human body the same way; as an ecosystem. Pain, stiffness, and weakness aren&rsquo;t random. They&rsquo;re patterns. And when you train with intention, those patterns change.
              </p>
              <p>
                That&rsquo;s how Sol Pilates Studio was born.
              </p>
              <p>
                The name Sol means &lsquo;Sun&rsquo; and I chose it because your body is the sun your life revolves around. When it hurts&hellip; your work, your relationships, your energy, your joy &mdash; all of it dims. When it&rsquo;s strong, everything else lights up.
              </p>
              <p>
                My method combines Pilates with strength training principles to create workouts that aren&rsquo;t just effective, but sustainable. Especially for people who are short on time but are tired of living with pain, stiffness, or that &ldquo;something&rsquo;s off&rdquo; feeling.
              </p>
              <p>
                Today, I work with busy professionals, young moms and aging adults who want to feel capable in their own bodies again. Not to push harder, but to build something that lasts.
              </p>
              <p className="text-olive-600 font-semibold">
                Because the goal was never to chase a certain look. It&rsquo;s to help you feel good in the life you&rsquo;re actually living.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Instagram Connect */}
      <section className="bg-peach-300 py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7 }}
            className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-6 border border-olive-600/10 bg-peach-200 px-6 py-8 text-center md:flex-row md:px-8 md:text-left"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-terra-400">
                Follow the practice
              </p>
              <h2 className="mt-3 font-display text-3xl font-black leading-none text-olive-600 md:text-4xl">
                Follow Founder on Instagram
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-olive-400">
                Studio updates, movement cues, and everyday Pilates inspiration.
              </p>
            </div>
            <a
              href="https://www.instagram.com/pilates.with.swetha/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-3 bg-terra-400 px-6 py-4 text-xs font-black uppercase tracking-widest text-peach-50 transition-colors hover:bg-terra-300"
              aria-label="Open @pilates.with.swetha on Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Core Statement — "Movement is More Than Exercise" */}
      {/* <section className="py-32 bg-warmDark-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-[12rem] font-black text-peach-200/[0.03] leading-none pointer-events-none font-display">
          SOL
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-peach-400 text-sm tracking-[0.3em] uppercase mb-8">At SOL, Movement is More Than Exercise</p>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-peach-200 tracking-normal leading-[1.1] font-display mb-12">
                IT IS STRENGTH.<br />
                IT IS CONTROL.<br />
                IT IS PROGRESS.
              </h2>
            </motion.div>

            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-peach-400/60 text-xs tracking-[0.3em] uppercase mb-10">
                The Practice is Built Around Three Core Principles
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Strength",
                    desc: "Building deep, functional power through controlled resistance and intentional movement patterns that strengthen from the core outward.",
                  },
                  {
                    title: "Control",
                    desc: "Mastering every movement with precision and awareness. In Pilates, quality always takes precedence over quantity — every rep is deliberate.",
                  },
                  {
                    title: "Transformation",
                    desc: "Going beyond physical change. SOL transforms how you move, how you feel, and how you carry yourself — body and mind, inside and out.",
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                    className="p-8 border border-peach-200/10 hover:border-terra-400/30 transition-all group"
                  >
                    <span className="text-terra-400 font-black text-5xl font-display block mb-4 group-hover:scale-105 transition-transform origin-left">
                      0{idx + 1}
                    </span>
                    <h3 className="text-peach-200 font-black text-xl tracking-wider mb-3 font-display uppercase">{item.title}</h3>
                    <p className="text-peach-400 text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section> 
      */}

      {/* What Sets Us Apart */}
      {/* <section className="py-24 bg-peach-300">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-normal font-display">
                WHAT SETS US APART
              </h2>
            </motion.div>

            <div className="space-y-8">
              {[
                {
                  title: "Modern Approach, Classical Roots",
                  desc: "We honour the classical Pilates method while embracing modern techniques and equipment. Every session blends tradition with innovation for a practice that truly works.",
                },
                {
                  title: "Controlled, Intentional Movement",
                  desc: "Nothing at SOL is random. Every exercise is purposeful — building strength, flexibility, and mental clarity through precise, deliberate movement patterns.",
                },
                {
                  title: "Warmth & Community",
                  desc: "Like the sun we're named after, SOL radiates warmth. Our studio is a welcoming space where every body belongs, from first-timers to seasoned practitioners.",
                },
                {
                  title: "Body & Mind Transformation",
                  desc: "We go beyond physical fitness. SOL transforms how you move through life — building confidence, reducing stress, and nurturing well-being from the inside out.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex gap-6 items-start p-8 bg-peach-200 border border-peach-400"
                >
                  <span className="text-terra-400 font-black text-2xl font-display shrink-0">0{idx + 1}</span>
                  <div>
                    <h3 className="text-olive-600 font-black text-lg mb-2 font-display">{item.title}</h3>
                    <p className="text-olive-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
}
