"use client"

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { GetStartedModal } from "@/components/auth/GetStartedModal";


// Service card data
const SERVICES = [
  {
    title: "ONLINE COACHING",
    icon: "asterisk",
    image: "/images/online-coaching.png",
  },
  {
    title: "CUSTOM TRACKING",
    icon: "triangle",
    image: "/images/custom-tracking.png",
  },
  {
    title: "DEDICATED TRAINERS",
    icon: "plus",
    image: "/images/dedicated-trainers.png",
  },
];

// Testimonials data
// Performance stats
const STATS = [
  { label: "SPECIFIC PREPARATION", value: 76 },
  { label: "CARDIO CONDITIONING", value: 59 },
  { label: "NUTRITION SKILLS", value: 98 },
];

// Animated progress bar component
function ProgressBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-white font-bold tracking-wider text-sm">{label}</span>
        <span className="text-white font-bold">{value}%</span>
      </div>
      <div className="h-1 bg-white/20 w-full">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 1.5, delay, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-red-600 to-red-500"
        />
      </div>
    </div>
  );
}

// Decorative icon component
function DecorativeIcon({ type, className = "" }: { type: string; className?: string }) {
  if (type === "asterisk") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="50" y1="10" x2="50" y2="90" />
        <line x1="10" y1="50" x2="90" y2="50" />
        <line x1="22" y1="22" x2="78" y2="78" />
        <line x1="78" y1="22" x2="22" y2="78" />
      </svg>
    );
  }
  if (type === "triangle") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="50,15 85,85 15,85" />
        <line x1="50" y1="15" x2="50" y2="55" />
      </svg>
    );
  }
  if (type === "plus") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="20" y="20" width="60" height="60" />
        <line x1="50" y1="35" x2="50" y2="65" />
        <line x1="35" y1="50" x2="65" y2="50" />
      </svg>
    );
  }
  return null;
}


import FacilitiesSection from "@/components/ui/facilities-cards";
import ImgStack from "@/components/ui/image-stack";
import MentorsDesktop from "@/components/ui/mentors-desktop";
import TestimonialsSection from "@/components/ui/testimonial-v2";

// ... existing imports ...

export default function Home() {

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex flex-col md:flex-row">
        {/* Mobile Background / Desktop Left Side */}
        <div className="absolute inset-0 md:relative md:w-1/2 md:min-h-screen z-0">
          <Image
            src="/images/hero-gym.png"
            alt="Gym workout"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Mobile Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black md:hidden" />
        </div>

        {/* Right side - Content */}
        <div className="relative z-10 w-full md:w-1/2 min-h-screen flex items-end md:items-center pb-20 md:pb-0 px-6 md:px-16 pointer-events-none md:pointer-events-auto bg-transparent md:bg-black">
          <div className="w-full">
            {/* Watermark */}
            <div className="absolute top-1/4 right-0 text-[12rem] font-black text-white/5 leading-none pointer-events-none hidden lg:block">
              CAN
            </div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8 md:mb-0"
            >
              <span className="text-white/70 text-2xl md:text-4xl font-light mb-2 block">+</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter text-white drop-shadow-xl md:drop-shadow-none">
                WHATEVER<br />
                YOU DECIDE,<br />
                YOU CAN DO<br />
                IT!
              </h1>
            </motion.div>

            {/* Get Started Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-8 md:mt-10 pointer-events-auto"
            >
              <button
                onClick={() => setShowGetStarted(true)}
                className="group inline-flex items-center gap-4"
              >
                <span className="px-8 py-4 md:px-10 md:py-5 bg-white text-black font-black text-xs md:text-sm tracking-widest hover:bg-neutral-200 transition-all uppercase">
                  Get Started
                </span>
                <span className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all bg-black/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Get Started Modal */}
      <GetStartedModal
        isOpen={showGetStarted}
        onClose={() => setShowGetStarted(false)}
      />





      {/* ========== SERVICES SECTION ========== */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16 relative">
            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[5rem] md:text-[12rem] font-black text-white/5 pointer-events-none whitespace-nowrap">
              GO!
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-white/50 text-2xl md:text-3xl font-light">+</span>
              <h2 className="text-3xl md:text-6xl font-black mt-2">DO IT FOR YOURSELF!</h2>
              <p className="text-white/60 mt-4 tracking-wider text-xs md:text-sm">MAKE A DIFFERENCE IN YOUR LIFE</p>
            </motion.div>
          </div>

          {/* Service Cards Grid/Scroll */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:grid md:grid-cols-3 md:gap-6 pb-6 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
            {SERVICES.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="relative group overflow-hidden min-w-[85vw] md:min-w-0 snap-center rounded-2xl md:rounded-none"
              >
                {/* Background Image */}
                <div className="relative h-[450px] md:h-[600px] w-full">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Decorative Icon */}
                  <div className="absolute top-6 left-6">
                    <DecorativeIcon type={service.icon} className="w-12 h-12 md:w-16 md:h-16 text-white/70" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-8 left-6 right-6">
                    <h3 className="text-xl md:text-2xl font-black mb-4">{service.title}</h3>
                    <button className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FACILITIES SECTION ========== */}
      <FacilitiesSection />

      {/* ========== MENTORS STACK SECTION ========== */}
      <section className="bg-black/95 py-24 border-t border-white/5 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <div className="text-center mb-16">
            <span className="text-white/50 text-sm font-bold tracking-[0.3em] uppercase block mb-3">Community</span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase relative inline-block">
              Elite Mentors
              <svg className="absolute -right-8 -top-8 w-6 h-6 text-white/20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            </h2>
            <p className="text-neutral-400 mt-4 max-w-sm mx-auto">
              Swipe through our roster of world-champion coaches.
            </p>
          </div>

          {/* Mobile View: Card Stack */}
          <div className="md:hidden">
            <ImgStack items={[
              {
                src: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop",
                name: "Marcus Cole",
                role: "Crossfit Master" // Intense
              },
              {
                src: "https://images.unsplash.com/photo-1611672585731-fa10603fb9e0?q=80&w=600&auto=format&fit=crop",
                name: "Elena Fox",
                role: "Aerobics Lead" // Focus
              },
              {
                src: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=600&auto=format&fit=crop",
                name: "David Stone",
                role: "Pure Strength" // Weights
              },
              {
                src: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=600&auto=format&fit=crop",
                name: "Sarah Jen",
                role: "Gymnastics" // Session
              },
              {
                src: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop",
                name: "Maya Lee",
                role: "Yoga Flow" // Female fitness
              }
            ]} />
          </div>

          {/* Desktop View: Sliding Carousel */}
          <div className="hidden md:block">
            <MentorsDesktop />
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS SECTION ========== */}
      <TestimonialsSection />

      {/* ========== PERFORMANCE SECTION ========== */}
      <section className="relative py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/performance-bg.png"
            alt="Performance background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Watermark */}
              <div className="text-[6rem] font-black text-white/5 absolute top-0 left-0 pointer-events-none hidden lg:block">
                BOOST
              </div>

              <span className="text-white/50 text-3xl font-light">+</span>
              <h2 className="text-4xl md:text-5xl font-black mt-2 mb-6">BOOST PERFORMANCE</h2>
              <p className="text-white/60 mb-8 max-w-md">
                Has ei fierent repudiandae, verear prompta mea ad. Cum eu unum dolore soluta, eam eu vidit.
              </p>

              <button className="group inline-flex items-center gap-4">
                <span className="px-8 py-4 border border-white font-bold text-sm tracking-wider hover:bg-white hover:text-black transition-all">
                  VIEW MORE
                </span>
                <span className="w-12 h-12 rounded-full border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </button>
            </motion.div>

            {/* Right - Progress Bars */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {STATS.map((stat, idx) => (
                <ProgressBar
                  key={idx}
                  label={stat.label}
                  value={stat.value}
                  delay={idx * 0.2}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </section>



      {/* ========== SCROLL TO TOP BUTTON ========== */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-[60]"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}
