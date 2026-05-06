"use client"

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { GetStartedModal } from "@/components/auth/GetStartedModal";


// Service card data
const SERVICES = [
  {
    title: "STRENGTH & SCULPT",
    icon: "asterisk",
    image: "/images/service-strength-sculpt.jpg",
    description: "Build lean muscle and define your physique through targeted Pilates exercises. Using reformer resistance and controlled mat work, this discipline focuses on sculpting long, toned muscles while building functional strength from your deep core outward.",
  },
  {
    title: "CARDIO & ENDURANCE",
    icon: "triangle",
    image: "/images/service-cardio-endurance.jpg",
    description: "Elevate your heart rate and stamina with high-energy Pilates sequences. Dynamic jumpboard work, circuit-style reformer flows, and tempo-driven mat routines push your cardiovascular limits while maintaining the precision Pilates is known for.",
  },
  {
    title: "RESET & RESTORE",
    icon: "plus",
    image: "/images/service-reset-restore.jpg",
    description: "Reconnect with your body through mindful, restorative Pilates movement. Gentle stretching, breathwork, and slow-flow sequences release tension, improve mobility, and bring your nervous system back into balance — perfect for recovery days.",
  },
  {
    title: "MUSCLE RECOVERY",
    icon: "circle",
    image: "/images/service-muscle-recovery.jpg",
    description: "Accelerate healing and prevent injury with targeted recovery techniques. Foam rolling, myofascial release, and therapeutic Pilates movements help flush lactic acid, restore range of motion, and keep your body performing at its best.",
  },
  {
    title: "INTENSE EXERCISE",
    icon: "diamond",
    image: "/images/service-intense-exercise.jpg",
    description: "Push your limits with advanced Pilates challenges designed for peak performance. Combining explosive power moves, heavy spring resistance, and complex coordination drills — this is Pilates at its most demanding and rewarding.",
  },
];

// Testimonials data
// Performance stats
const STATS = [
  { label: "STRENGTH & TONE", value: 85 },
  { label: "BODY CONTROL", value: 92 },
  { label: "TOTAL TRANSFORMATION", value: 78 },
];

// Animated progress bar component
function ProgressBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-peach-200 font-bold tracking-wider text-sm">{label}</span>
        <span className="text-terra-400 font-bold">{value}%</span>
      </div>
      <div className="h-1 bg-peach-200/10 w-full rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 1.5, delay, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-terra-400 to-terra-300 rounded-full"
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
  if (type === "circle") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="50" cy="50" r="35" />
        <circle cx="50" cy="50" r="15" />
      </svg>
    );
  }
  if (type === "diamond") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="50,15 85,50 50,85 15,50" />
        <line x1="50" y1="30" x2="50" y2="70" />
      </svg>
    );
  }
  return null;
}


import FacilitiesSection from "@/components/ui/facilities-cards";
import ImgStack from "@/components/ui/image-stack";
import { CircularTestimonials } from "@/components/ui/circular-testimonials";

// ... existing imports ...

export default function Home() {

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [expandedService, setExpandedService] = useState<number | null>(null);

  // --- Service Slider State ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const [sliderOffset, setSliderOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dotCount, setDotCount] = useState(SERVICES.length);
  const dragStartX = useRef(0);

  const getMaxSlide = () => {
    if (typeof window === "undefined") return 2;
    return SERVICES.length - (window.innerWidth >= 768 ? 3 : 1);
  };

  // Recalculate pixel offset when slide changes or window resizes
  useEffect(() => {
    const recalcOffset = () => {
      if (!sliderTrackRef.current) return;
      const cards = Array.from(sliderTrackRef.current.children) as HTMLElement[];
      if (cards[currentSlide]) {
        setSliderOffset(cards[currentSlide].offsetLeft);
      }
    };
    recalcOffset();
    setDotCount(getMaxSlide() + 1);
    const handleResize = () => { recalcOffset(); setDotCount(getMaxSlide() + 1); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentSlide]);

  // Auto-advance slider
  useEffect(() => {
    if (isSliderPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        const max = getMaxSlide();
        return prev >= max ? 0 : prev + 1;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [isSliderPaused]);

  const nextSlide = () => {
    setCurrentSlide(prev => {
      const max = getMaxSlide();
      return prev >= max ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentSlide(prev => {
      const max = getMaxSlide();
      return prev <= 0 ? max : prev - 1;
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setIsSliderPaused(true);
    dragStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsSliderPaused(false);
    const diff = dragStartX.current - e.clientX;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
  };

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
    <div className="min-h-screen bg-peach-200 text-olive-400 font-sans overflow-x-hidden">

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex flex-col md:flex-row">
        {/* Mobile Background / Desktop Left Side */}
        <div className="absolute inset-0 md:relative md:w-1/2 md:min-h-screen z-0">
          <Image
            src="/images/sol-hero-poster.jpeg"
            alt="SOL Pilates - Strength in Every Movement"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Mobile Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-warmDark-800/30 via-warmDark-800/60 to-warmDark-800 md:hidden" />
        </div>

        {/* Right side - Content */}
        <div className="relative z-10 w-full md:w-1/2 min-h-screen flex items-end md:items-center pb-20 md:pb-0 px-6 md:px-16 pointer-events-none md:pointer-events-auto bg-transparent md:bg-peach-200">
          <div className="w-full">
            {/* Watermark */}
            <div className="absolute top-1/4 right-0 text-[12rem] font-black text-olive-400/5 leading-none pointer-events-none hidden lg:block">
              SOL
            </div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8 md:mb-0"
            >
              <span className="text-terra-400/70 text-2xl md:text-4xl font-light mb-2 block">+</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter text-peach-50 md:text-olive-600 drop-shadow-xl md:drop-shadow-none font-display">
                WHERE<br />
                MOVEMENT<br />
                MEETS<br />
                CALM
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
                <span className="px-8 py-4 md:px-10 md:py-5 bg-terra-400 text-peach-50 font-black text-xs md:text-sm tracking-widest hover:bg-terra-300 transition-all uppercase shadow-glow">
                  Get Started
                </span>
                <span className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-terra-400 flex items-center justify-center group-hover:bg-terra-400 group-hover:text-peach-50 transition-all bg-warmDark-800/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none text-terra-400">
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
      <section className="py-24 bg-peach-300">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16 relative">
            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[5rem] md:text-[12rem] font-black text-olive-400/5 pointer-events-none whitespace-nowrap">
              SOL
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-terra-400/50 text-2xl md:text-3xl font-light">+</span>
              <h2 className="text-3xl md:text-6xl font-black mt-2 text-olive-600 font-display">STRENGTHEN, SCULPT, TRANSFORM</h2>
              <p className="text-olive-300 mt-4 tracking-wider text-xs md:text-sm">A SOPHISTICATED APPROACH TO PILATES & WELLNESS</p>
            </motion.div>
          </div>

          {/* Service Slider */}
          <div
            className="relative"
            onMouseEnter={() => setIsSliderPaused(true)}
            onMouseLeave={() => setIsSliderPaused(false)}
          >
            {/* Slider Track */}
            <div
              className="overflow-hidden rounded-lg select-none"
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => { if (isDragging) { setIsDragging(false); setIsSliderPaused(false); } }}
            >
              <div
                ref={sliderTrackRef}
                className="flex gap-4 md:gap-6 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{ transform: `translateX(-${sliderOffset}px)` }}
              >
                {SERVICES.map((service, idx) => (
                  <div
                    key={idx}
                    className="relative group overflow-hidden rounded-lg flex-shrink-0 w-full md:w-[calc(33.333%-16px)] cursor-pointer"
                    onClick={() => setExpandedService(expandedService === idx ? null : idx)}
                  >
                    <div className="relative h-[450px] md:h-[600px] w-full">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        className={`object-cover transition-transform duration-700 ${expandedService === idx ? "scale-110" : "group-hover:scale-110"}`}
                      />
                      <div className={`absolute inset-0 transition-all duration-500 ${expandedService === idx ? "bg-gradient-to-t from-warmDark-800/95 via-warmDark-800/70 to-warmDark-800/40" : "bg-gradient-to-t from-warmDark-800/90 via-warmDark-800/20 to-transparent"}`} />

                      {/* Decorative Icon */}
                      <div className="absolute top-6 left-6">
                        <DecorativeIcon type={service.icon} className="w-12 h-12 md:w-16 md:h-16 text-terra-400/70" />
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-8 left-6 right-6">
                        <h3 className="text-xl md:text-2xl font-black mb-3 text-peach-50 font-display">{service.title}</h3>

                        {/* Expandable Description */}
                        <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${expandedService === idx ? "max-h-[200px] opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"}`}>
                          <p className="text-peach-300 text-sm leading-relaxed">{service.description}</p>
                        </div>

                        <button className={`w-12 h-12 rounded-full border border-terra-400/50 flex items-center justify-center transition-all duration-300 ${expandedService === idx ? "bg-terra-400 text-peach-50 rotate-45" : "hover:bg-terra-400 hover:text-peach-50 text-terra-300"}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: dotCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? "bg-terra-400 w-8"
                      : "bg-olive-400/20 w-2 hover:bg-olive-400/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== FACILITIES SECTION ========== */}
      <FacilitiesSection />

      {/* ========== TESTIMONIALS SECTION ========== */}
      <section className="bg-warmDark-800 py-24 border-t border-peach-200/5 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <div className="text-center mb-16">
            <span className="text-terra-400/60 text-sm font-bold tracking-[0.3em] uppercase block mb-3">Success Stories</span>
            <h2 className="text-4xl md:text-5xl font-black text-peach-200 tracking-tighter uppercase relative inline-block font-display">
              Testimonials
              <svg className="absolute -right-8 -top-8 w-6 h-6 text-terra-400/30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            </h2>
            <p className="text-peach-400 mt-4 max-w-sm mx-auto">
              Hear from our community about their transformative Pilates journey.
            </p>
          </div>

          {/* Mobile View: Card Stack */}
          <div className="md:hidden">
            <ImgStack items={[
              {
                src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
                name: "Srikanth Nomula",
                role: "Engineer"
              },
              {
                src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
                name: "Pallavi Jalakam",
                role: "Engineer"
              },
              {
                src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
                name: "Sushma Gurram",
                role: "Engineer"
              },
              {
                src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
                name: "Melinda Hattan",
                role: "Pilates Studio Owner & Instructor"
              },
              {
                src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
                name: "Sai Shruthi Sayini",
                role: "Pilates Instructor"
              }
            ]} />
          </div>

          {/* Desktop View: Sliding Carousel */}
          <div className="hidden md:block">
            <div className="hidden md:flex justify-center items-center py-0">
              <CircularTestimonials
                testimonials={[
                  {
                    name: "Srikanth Nomula",
                    designation: "Engineer",
                    quote: "I was not able to spend much time with my daughter or do activities because of back pain. With Swetha's personalized approach, it not only helped alleviate my back pain but also allowed me to spend more quality time with my daughter. I felt more energetic and capable of participating in her activities.",
                    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
                  },
                  {
                    name: "Pallavi Jalakam",
                    designation: "Engineer",
                    quote: "I was struggling with lower back pain while bending and was not able to stretch completely during yoga poses. After starting my sessions with Swetha, I can do my yoga poses such as forward bends and back rolls with ease.",
                    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
                  },
                  {
                    name: "Sushma Gurram",
                    designation: "Engineer",
                    quote: "Because of my back pain, I become restless with my toddler and pain adds to make the already cranky situation worse. Since working with Swetha, my back has become more flexible and core and arm strength increased.",
                    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
                  },
                  {
                    name: "Melinda Hattan",
                    designation: "Pilates Studio Owner & Instructor",
                    quote: "Swetha has great energy in the room. She is passionate about movement and it shows (in the best way). Her cueing is clear, direct, and somehow makes you realize muscles you didn't even know you had are definitely working.",
                    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
                  },
                  {
                    name: "Sai Shruthi Sayini",
                    designation: "Pilates Instructor",
                    quote: "I tried Pilates after trying everything to heal my sciatica pain. After a lot of research, I decided to give Pilates one last shot — and it worked. My back pain is gone, I've built so much more muscle, and I feel genuinely confident in my body again.",
                    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
                  }
                ]}
                autoplay={true}
                colors={{
                  name: "#F0D8C0",
                  designation: "#8B3F2C",
                  testimony: "#D4B494",
                  arrowBackground: "#3B2F28",
                  arrowForeground: "#F0D8C0",
                  arrowHoverBackground: "#8B3F2C",
                }}
                fontSizes={{
                  name: "3rem",
                  designation: "1rem",
                  quote: "1.25rem",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== PERFORMANCE SECTION ========== */}
      <section className="relative py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/sol-pilates-mat-brown.jpeg"
            alt="SOL Pilates mat session"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-warmDark-800/80" />
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
              <div className="text-[6rem] font-black text-peach-200/5 absolute top-0 left-0 pointer-events-none hidden lg:block">
                PROGRESS
              </div>

              <span className="text-terra-400/50 text-3xl font-light">+</span>
              <h2 className="text-4xl md:text-5xl font-black mt-2 mb-6 text-peach-200 font-display">IT IS STRENGTH.<br />IT IS CONTROL.<br />IT IS PROGRESS.</h2>
              <p className="text-peach-400 mb-8 max-w-md">
                At SOL, movement is more than exercise. Track your journey across every discipline — from core stability to full-body transformation.
              </p>

              <button className="group inline-flex items-center gap-4">
                <span className="px-8 py-4 border border-terra-400 text-terra-300 font-bold text-sm tracking-wider hover:bg-terra-400 hover:text-peach-50 transition-all">
                  VIEW MORE
                </span>
                <span className="w-12 h-12 rounded-full border border-terra-400 text-terra-300 flex items-center justify-center group-hover:bg-terra-400 group-hover:text-peach-50 transition-all">
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
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 bg-terra-400/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-terra-400/40 transition-all z-[60] border border-terra-400/30"
        >
          <svg className="w-5 h-5 text-terra-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}
