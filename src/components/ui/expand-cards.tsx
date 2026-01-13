"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Trainer {
    id: number;
    name: string;
    role: string;
    image: string;
}

const trainers: Trainer[] = [
    {
        id: 1,
        name: "Alex Rivera",
        role: "Elite Strength Coach",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 2,
        name: "Sarah Chen",
        role: "Yoga & Mobility Specialist",
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 3,
        name: "Marcus Johnson",
        role: "HIIT & Cardio Expert",
        image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 4,
        name: "Elena Rodriguez",
        role: "Performance Nutritionist",
        image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 5,
        name: "David Kim",
        role: "CrossFit Level 3 Trainer",
        image: "https://images.unsplash.com/photo-1561623861-12502788e02d?q=80&w=1000&auto=format&fit=crop",
    },
];

export default function TrainersExpandSection() {
    const [activeId, setActiveId] = useState<number>(1);

    return (
        <section className="bg-black py-24 relative overflow-hidden">
            {/* Header */}
            <div className="container px-4 mx-auto mb-12 flex flex-col items-center text-center">
                <div className="border border-neutral-800 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-neutral-400 bg-neutral-900/50 mb-6">
                    Our Team
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                    MEET THE EXPERTS
                </h2>
                <p className="text-neutral-400 max-w-lg text-lg">
                    World-class trainers dedicated to pushing your limits.
                </p>
            </div>

            {/* ==================== DESKTOP VIEW ==================== */}
            <div className="hidden md:flex container mx-auto px-4 h-[500px] gap-3 items-stretch justify-center">
                {trainers.map((trainer) => (
                    <div
                        key={trainer.id}
                        onMouseEnter={() => setActiveId(trainer.id)}
                        className={cn(
                            "relative cursor-pointer overflow-hidden rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-2xl",
                            activeId === trainer.id
                                ? "flex-[2] opacity-100"
                                : "flex-[0.5] opacity-60 hover:opacity-100"
                        )}
                    >
                        <img
                            src={trainer.image}
                            alt={trainer.name}
                            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                        />
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500",
                            activeId === trainer.id ? "opacity-100" : "opacity-70"
                        )} />
                        <div className={cn(
                            "absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end transition-all duration-500 overflow-hidden",
                            activeId === trainer.id ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                        )}>
                            <h3 className="text-3xl font-bold text-white mb-1 leading-tight drop-shadow-lg">{trainer.name}</h3>
                            <p className="text-primary font-medium tracking-wide uppercase text-base text-gray-300 drop-shadow-md">{trainer.role}</p>
                            <div className={cn(
                                "overflow-hidden transition-all duration-500 delay-75 ease-in-out",
                                activeId === trainer.id ? "max-h-20 mt-4 opacity-100" : "max-h-0 opacity-0"
                            )}>
                                <button className="text-xs font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-colors uppercase tracking-wider">
                                    View Profile
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ==================== MOBILE VIEW (PREMIUM VERTICAL STACK) ==================== */}
            <div className="md:hidden flex flex-col gap-3 px-4 pb-12">
                {trainers.map((trainer) => (
                    <div
                        key={trainer.id}
                        onClick={() => setActiveId(activeId === trainer.id ? 0 : trainer.id)}
                        className={cn(
                            "relative w-full rounded-3xl overflow-hidden transition-all duration-700 cubic-bezier(0.25, 1, 0.5, 1) ease-out shadow-2xl",
                            activeId === trainer.id ? "h-[500px] shrink-0" : "h-[100px] shrink-1 active:scale-95"
                        )}
                    >
                        {/* Image Background */}
                        <img
                            src={trainer.image}
                            alt={trainer.name}
                            className={cn(
                                "absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000",
                                activeId === trainer.id ? "scale-100" : "scale-125 opacity-60"
                            )}
                        />

                        {/* Overlay Gradients */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/90 transition-opacity duration-500",
                            activeId === trainer.id ? "opacity-100" : "opacity-80"
                        )} />

                        {/* Inactive State Label */}
                        <div className={cn(
                            "absolute inset-0 flex items-center px-8 transition-all duration-500",
                            activeId === trainer.id ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"
                        )}>
                            <span className="text-3xl font-black text-white/50 tracking-tighter uppercase mr-6">0{trainer.id}</span>
                            <h3 className="text-2xl font-bold text-white tracking-tight uppercase">{trainer.name}</h3>
                        </div>

                        {/* Active State Content */}
                        <div className={cn(
                            "absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end transition-all duration-700 delay-100",
                            activeId === trainer.id ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                        )}>
                            <div className="border-l-2 border-white/30 pl-4 mb-4">
                                <span className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase block mb-1">
                                    Expert 0{trainer.id}
                                </span>
                                <h3 className="text-4xl font-black text-white uppercase leading-[0.9] tracking-tight mb-2">
                                    {trainer.name}
                                </h3>
                                <p className="text-white/80 font-medium tracking-wide text-sm">
                                    {trainer.role}
                                </p>
                            </div>

                            <button className="w-full bg-white text-black font-bold py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors">
                                View Full Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
