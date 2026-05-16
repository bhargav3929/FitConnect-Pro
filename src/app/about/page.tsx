"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "@/lib/animation/Reveal";
import { InstagramSection } from "@/components/home/InstagramSection";

const E: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
            <h1 className="font-display font-black tracking-tight leading-[0.95] text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-peach-50 uppercase text-center w-full">
              ABOUT SOL
            </h1>
          </motion.div>
        </div>
      </section>

      {/* SECTION 1 — Bio */}
      <section className="py-24 bg-peach-300">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <Reveal variant="slideUp" className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-tight mb-8 font-display">
                YOUR BODY IS THE SUN
              </h2>
            </Reveal>

            <Reveal variant="slideUp" className="space-y-5 text-olive-400 leading-relaxed text-lg">
              <p>
                At Sol Pilates Studio, we believe your body is the sun your life revolves around.
              </p>
              <p>
                When it&rsquo;s in pain, everything feels heavier. When it&rsquo;s strong, everything feels possible.
              </p>
              <p>
                Our method combines Pilates with strength training principles and a rehab mindset — so you&rsquo;re not just working out, you&rsquo;re moving out of pain and into a better quality of life. No extremes. No quick fixes. Just intentional movement that helps you stand taller, move freer, and feel at home in your body again.
              </p>
              <p className="text-olive-600 font-semibold">
                Because when your sol is strong, your whole life gets lighter.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 2 — The Sol Philosophy */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal variant="slideUp">
              <div className="border border-terra-400/30 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-terra-400 bg-terra-400/10 mb-6 inline-block">
                The Sol Philosophy
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-tight mb-6 font-display">
                THREE IMAGES, ONE PHILOSOPHY
              </h2>
              <div className="space-y-5 text-olive-400 leading-relaxed">
                <p>
                  Look closely at the O in our logo — a figure in child&rsquo;s pose, a wave on the horizon and a sun rising above it. Three images, one philosophy.
                </p>
                <p>
                  At Sol, strength and recovery aren&rsquo;t opposites. They&rsquo;re the same practice. Contrology-based, rehab-informed, built for real bodies and real lives.
                </p>
              </div>
            </Reveal>

            <Reveal variant="slideUp" className="relative">
              <div className="relative h-[500px] overflow-hidden">
                <Image
                  src="/images/sol-philosophy.jpg"
                  alt="The Sol Philosophy — the O in our logo"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warmDark-800/20 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border-2 border-terra-400/20 -z-10" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Founder Story + Instagram */}
      <section className="py-24 bg-peach-300">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto mb-24">
            <Reveal variant="slideUp" className="text-center mb-10">
              <div className="border border-terra-400/30 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-terra-400 bg-terra-400/10 mb-6 inline-block">
                Meet Our Founder
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-tight mb-8 font-display">
                FROM ENGINEERING TO MOVEMENT
              </h2>
            </Reveal>

            <Reveal variant="slideUp" className="space-y-5 text-olive-400 leading-relaxed text-lg">
              <p>
                I didn&rsquo;t come from a traditional fitness background; I came from engineering.
              </p>
              <p>
                With a Master&rsquo;s in Electrical Engineering and years spent in high-performance environments, I&rsquo;ve always approached problems the same way: understand the system deeply before trying to fix it.
              </p>
              <p>
                Over time, I started seeing the human body the same way — as an ecosystem. Every muscle, joint, and movement pattern connected to everything else. Pain, stiffness, and weakness aren&rsquo;t random. They&rsquo;re signals. And when you train with intention, those signals change. That&rsquo;s how Sol Pilates Studio was born.
              </p>
              <p>
                The name Sol means &lsquo;Sun&rsquo; — and I chose it because your body is the sun your life revolves around. When it hurts, your work, your relationships, your energy, your joy — all of it dims. When it&rsquo;s strong, everything else lights up.
              </p>
              <p>
                My method combines Pilates with strength training principles to create workouts that aren&rsquo;t just effective, but sustainable. Especially for people who are short on time but tired of living with pain, stiffness, or that &ldquo;something&rsquo;s off&rdquo; feeling.
              </p>
              <p>
                Today, I work with busy professionals, young moms and aging adults who want to feel capable in their own bodies again. Not to push harder, but to build something that lasts.
              </p>
              <p>
                Because the goal was never to chase a certain look. It&rsquo;s to help you feel good in the life you&rsquo;re actually living.
              </p>
              <p className="text-olive-600 font-semibold">
                I built it in Hyderabad because this is home — and I wanted to bring the best of what I learned to the people I grew up around.
              </p>
            </Reveal>
          </div>
        </div>

        <InstagramSection />
      </section>

      {/* SECTION 4 — CTA */}
      <section className="py-24 bg-warmDark-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-[12rem] font-black text-peach-200/[0.03] leading-none pointer-events-none font-display">
          SOL
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto">
            <Reveal variant="slideUp" className="bg-peach-100 p-10 md:p-14 text-center">
              <h2 className="text-3xl md:text-5xl font-black text-olive-600 tracking-tight mb-6 font-display">
                READY TO START?<br />YOUR FIRST CLASS IS ON US.
              </h2>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [...E], delay: 0.1 }}
              >
                <Link
                  href="/free-class"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-terra-400 text-peach-50 font-black text-xs tracking-widest uppercase hover:bg-terra-300 transition-all shadow-glow"
                >
                  Book your free class
                </Link>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
