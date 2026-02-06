"use client";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const facilities = [
    {
        id: 1,
        name: "FitPro Downtown",
        location: "123 Main St, New York, NY",
        image: "/images/gyms/fitpro-downtown.png",
        rating: 4.9,
    },
    {
        id: 2,
        name: "FitPro Midtown",
        location: "56 Park Ave, New York, NY",
        image: "/images/gyms/fitpro-midtown.png",
        rating: 4.8,
    },
    {
        id: 3,
        name: "FitPro Uptown",
        location: "789 Broadway, New York, NY",
        image: "/images/gyms/fitpro-uptown.png",
        rating: 4.7,
    },
    {
        id: 4,
        name: "FitPro Brooklyn",
        location: "321 Atlantic Ave, Brooklyn, NY",
        image: "/images/gyms/fitpro-brooklyn.png",
        rating: 4.6,
    },
    {
        id: 5,
        name: "FitPro Queens",
        location: "12 Queens Blvd, Queens, NY",
        image: "/images/gyms/fitpro-queens.png",
        rating: 4.5,
    }
];

export default function FacilitiesSection() {
    const [activeId, setActiveId] = useState<number>(1);
    const mobileContainerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Intersection Observer to detect when section is visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0.3 } // Trigger when 30% visible
        );

        if (mobileContainerRef.current) {
            observer.observe(mobileContainerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Auto-play logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isInView && !hasInteracted) {
            interval = setInterval(() => {
                setActiveId((prevId) => {
                    const currentIndex = facilities.findIndex(f => f.id === prevId);
                    const nextIndex = (currentIndex + 1) % facilities.length;
                    return facilities[nextIndex].id;
                });
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [isInView, hasInteracted]);

    return (
        <section className="bg-[#0B0F19] py-24 relative overflow-hidden">
            {/* Header */}
            <div className="container px-4 mx-auto mb-12 flex flex-col items-center text-center">
                <div className="border border-coral-400/30 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-coral-400 bg-coral-400/10 mb-6">
                    Our Locations
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-[#F0F2F5] tracking-tight mb-4">
                    WORLD CLASS FACILITIES
                </h2>
                <p className="text-[#8892A4] max-w-lg text-lg">
                    Train in state-of-the-art environments designed for peak performance.
                </p>
            </div>

            {/* ==================== DESKTOP VIEW ==================== */}
            <div className="hidden md:flex container mx-auto px-4 h-[500px] gap-3 items-stretch justify-center">
                {facilities.map((facility) => (
                    <div
                        key={facility.id}
                        onMouseEnter={() => setActiveId(facility.id)}
                        className={cn(
                            "relative cursor-pointer overflow-hidden rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-2xl",
                            activeId === facility.id
                                ? "flex-[2] opacity-100"
                                : "flex-[0.5] opacity-60 hover:opacity-100"
                        )}
                    >
                        <img
                            src={facility.image}
                            alt={facility.name}
                            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                        />
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-t from-[#0B0F19]/95 via-[#0B0F19]/40 to-transparent transition-opacity duration-500",
                            activeId === facility.id ? "opacity-100" : "opacity-70"
                        )} />
                        <div className={cn(
                            "absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end transition-all duration-500 overflow-hidden",
                            activeId === facility.id ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                        )}>
                            <h3 className="text-3xl font-bold text-[#F0F2F5] mb-1 leading-tight drop-shadow-lg">{facility.name}</h3>
                            <p className="font-medium tracking-wide text-base text-coral-300 drop-shadow-md">{facility.location}</p>
                            <div className={cn(
                                "overflow-hidden transition-all duration-500 delay-75 ease-in-out",
                                activeId === facility.id ? "max-h-20 mt-4 opacity-100" : "max-h-0 opacity-0"
                            )}>
                                <button className="text-xs font-bold bg-coral-400 text-[#0B0F19] px-5 py-2.5 rounded-full hover:bg-coral-300 transition-colors uppercase tracking-wider shadow-[0_0_20px_rgba(255,106,61,0.3)]">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ==================== MOBILE VIEW (VERTICAL ACCORDION) ==================== */}
            <div
                ref={mobileContainerRef}
                className="md:hidden flex flex-col px-4 gap-4"
            >
                {facilities.map((facility) => (
                    <div
                        key={facility.id}
                        onClick={() => {
                            setActiveId(facility.id);
                            setHasInteracted(true); // Stop auto-play immediately on user interaction
                        }}
                        className={cn(
                            "relative overflow-hidden rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-lg border border-[#1A2238]",
                            activeId === facility.id ? "h-[450px]" : "h-[100px]"
                        )}
                    >
                        {/* Background Image */}
                        <img
                            src={facility.image}
                            alt={facility.name}
                            className={cn(
                                "absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700",
                                activeId === facility.id ? "scale-100" : "scale-110 opacity-60"
                            )}
                        />

                        {/* Gradient Overlay */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-b transition-all duration-500",
                            activeId === facility.id
                                ? "from-transparent via-[#0B0F19]/20 to-[#0B0F19]/95"
                                : "from-[#0B0F19]/40 via-[#0B0F19]/60 to-[#0B0F19]/80"
                        )} />

                        {/* Content Container */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                            {/* Minimized/Maximized Title */}
                            <div className={cn(
                                "transition-all duration-500",
                                activeId === facility.id ? "mb-auto mt-auto translate-y-0" : "mb-0 translate-y-0"
                            )}>
                                <div className="flex justify-between items-center w-full">
                                    <h3 className={cn(
                                        "font-black text-[#F0F2F5] uppercase tracking-tighter transition-all duration-500 leading-none",
                                        activeId === facility.id ? "text-4xl mb-2" : "text-xl"
                                    )}>
                                        {facility.name}
                                    </h3>
                                    {/* Icon Removed as requested */}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <div className={cn(
                                "overflow-hidden transition-all duration-500 ease-in-out gap-4 flex flex-col",
                                activeId === facility.id ? "opacity-100 max-h-[200px] mt-4" : "opacity-0 max-h-0 mt-0"
                            )}>
                                <p className="text-[#8892A4] text-sm font-medium leading-relaxed">
                                    {facility.location} — Experience the pinnacle of fitness luxury with our dedicated zones for strength, cardio, and recovery.
                                </p>
                                <button className="self-start text-xs font-bold bg-coral-400 text-[#0B0F19] px-6 py-3 rounded-full hover:bg-coral-300 transition-colors uppercase tracking-wider shadow-[0_0_20px_rgba(255,106,61,0.3)]">
                                    Explore Facility
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
