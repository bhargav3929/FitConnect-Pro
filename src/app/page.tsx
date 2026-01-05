"use client"

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, MapPin, Heart, Calendar, UserPlus, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const FEATURED_PROGRAMS = [
  {
    title: "Beginner Sessions",
    desc: "Learn the fundamentals of padel in a fun, easy-paced setting.",
    image: "https://images.unsplash.com/photo-1626248318856-7f4c0ee1C986?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Group Training",
    desc: "Train with friends and meet new players in our dynamic group classes.",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1593&auto=format&fit=crop"
  },
  {
    title: "Junior Programs",
    desc: "Build young players' confidence with structured skill development.",
    image: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1469&auto=format&fit=crop"
  },
  {
    title: "Private Coaching",
    desc: "Get one-on-one feedback tailored to your goals and play style.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-lime-400 selection:text-navy-900">

      {/* 
        HERO SECTION 
        Pickyard Style: Fullscreen immersive visual
      */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1626248318856-7f4c0ee1c986?q=80&w=2670&auto=format&fit=crop"
            alt="Hero Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-navy-900/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-start pt-20">
          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-6"
            >
              WHERE PASSION <br />
              MEETS <span className="text-lime-400">PERFORMANCE</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-white/90 font-medium max-w-xl mb-10"
            >
              Discover the sport that's taking the world by storm.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <Button className="bg-lime-400 hover:bg-lime-500 text-navy-900 font-black h-16 px-8 rounded-full text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(223,255,0,0.4)] hover:shadow-[0_0_50px_rgba(223,255,0,0.6)] transition-all transform hover:-translate-y-1">
                Book a Court
                <Calendar className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" className="border-2 border-white text-navy-900 hover:bg-white hover:text-navy-900 h-16 px-8 rounded-full text-lg font-bold uppercase tracking-wider backdrop-blur-sm transition-all">
                Open Play
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </div>

          {/* Floating UI Card - "Active Members" */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute right-8 bottom-32 hidden md:block"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl w-80 shadow-2xl">
              <div className="flex -space-x-4 mb-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gray-300 overflow-hidden relative">
                    <Image src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Member" fill className="object-cover" />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full bg-lime-400 border-2 border-white flex items-center justify-center font-bold text-navy-900 text-xs">
                  +12k
                </div>
              </div>
              <h3 className="text-3xl font-black text-white mb-1">12K+</h3>
              <p className="text-lime-400 font-bold uppercase text-xs tracking-wider">Active Members</p>
              <p className="text-white/60 text-xs mt-2">A thriving community of players across all skill levels.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 
        SCROLLING TICKER
        Neon Lime Bar
      */}
      <div className="bg-lime-400 py-6 overflow-hidden transform -rotate-1 shadow-xl relative z-20 mx-[-20px]">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center mx-8">
              <Dumbbell className="w-8 h-8 text-navy-900 mr-4" />
              <span className="text-4xl font-black text-navy-900 uppercase tracking-tighter">EXPERIENCE FITCONNECT</span>
            </div>
          ))}
        </motion.div>
      </div>


      {/* 
        FEATURED PROGRAMS GRID
        Bento Style
      */}
      <section className="py-32 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-navy-900 tracking-tighter mb-6">
              From First Swing to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy-900 to-navy-700">Pro Match</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
              Whether you're learning the basics or refining your advanced strategy, our certified coaches are here to guide you.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {FEATURED_PROGRAMS.map((program, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white rounded-[2rem] p-4 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="relative h-64 rounded-[1.5rem] overflow-hidden mb-6">
                  <Image src={program.image} alt={program.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <div className="px-2 pb-4 text-center">
                  <h3 className="text-xl font-black text-navy-900 mb-3">{program.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{program.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        FACILITIES SECTION 
        Dark Card
      */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-navy-900 rounded-[3rem] p-12 md:p-24 relative overflow-hidden">
            {/* Abstract Lines */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 L100 0 L100 100 Z" fill="#DFFF00" />
              </svg>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                  Our <span className="text-lime-400">Facilities</span>
                </h2>
                <p className="text-white/80 text-xl font-medium max-w-md">
                  Step into our state-of-the-art venue featuring everything you need for the perfect game.
                </p>

                <div className="space-y-4">
                  {[
                    "6 Panoramic glass courts with pro-level turf",
                    "Outdoor & Indoor options for all-weather play",
                    "Floodlights for night matches",
                    "Modern locker rooms and showers",
                    "A chill café-bar and pro shop for all your gear"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center text-white font-bold">
                      <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center mr-4 shadow-[0_0_10px_rgba(223,255,0,0.5)]">
                        <svg className="w-3 h-3 text-navy-900 stroke-current stroke-2" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>

                <Button className="bg-lime-400 text-navy-900 font-black px-8 py-6 rounded-full text-sm uppercase tracking-wider hover:bg-lime-500 hover:scale-105 transition-all mt-8">
                  Get Started Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              {/* Video/Image Placeholder */}
              <div className="relative h-[600px] rounded-[2rem] overflow-hidden border-8 border-white/5 shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1632766300456-e260905952c1?q=80&w=1587&auto=format&fit=crop"
                  alt="Facilities"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-navy-900 fill-current translate-x-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
