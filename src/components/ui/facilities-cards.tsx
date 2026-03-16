"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const amenities = [
    {
        id: 1,
        name: "Reformer Studio",
        tagline: "State-of-the-art Balanced Body reformers",
        image: "/images/gyms/fitpro-downtown.png",
    },
    {
        id: 2,
        name: "Mat Studio",
        tagline: "Dedicated space for mat Pilates & floor work",
        image: "/images/gyms/fitpro-midtown.png",
    },
    {
        id: 3,
        name: "Private Suite",
        tagline: "One-on-one sessions in an intimate setting",
        image: "/images/gyms/fitpro-uptown.png",
    },
    {
        id: 4,
        name: "Barre & Stretch",
        tagline: "Barre-fusion and deep flexibility training",
        image: "/images/gyms/fitpro-brooklyn.png",
    },
    {
        id: 5,
        name: "Recovery Lounge",
        tagline: "Post-session recovery and relaxation",
        image: "/images/gyms/fitpro-queens.png",
    }
];

export default function FacilitiesSection() {
    const [activeId, setActiveId] = useState<number>(1);
    const mobileContainerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0.3 }
        );

        if (mobileContainerRef.current) {
            observer.observe(mobileContainerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isInView && !hasInteracted) {
            interval = setInterval(() => {
                setActiveId((prevId) => {
                    const currentIndex = amenities.findIndex(f => f.id === prevId);
                    const nextIndex = (currentIndex + 1) % amenities.length;
                    return amenities[nextIndex].id;
                });
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [isInView, hasInteracted]);

    return (
        <section className="bg-peach-200 py-24 relative overflow-hidden">
            {/* Header */}
            <div className="container px-4 mx-auto mb-12 flex flex-col items-center text-center">
                <div className="border border-terra-400/30 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-terra-400 bg-terra-400/10 mb-6">
                    Our Studios
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-tight mb-4 font-display">
                    SPACES DESIGNED FOR YOU
                </h2>
                <p className="text-olive-300 max-w-lg text-lg">
                    Five dedicated studios, each crafted for a specific Pilates discipline.
                </p>
            </div>

            {/* ==================== DESKTOP VIEW ==================== */}
            <div className="hidden md:flex container mx-auto px-4 h-[500px] gap-3 items-stretch justify-center">
                {amenities.map((amenity) => (
                    <div
                        key={amenity.id}
                        onMouseEnter={() => setActiveId(amenity.id)}
                        className={cn(
                            "relative cursor-pointer overflow-hidden rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-2xl",
                            activeId === amenity.id
                                ? "flex-[2] opacity-100"
                                : "flex-[0.5] opacity-60 hover:opacity-100"
                        )}
                    >
                        <Image
                            src={amenity.image}
                            alt={amenity.name}
                            fill
                            className="object-cover object-center transition-transform duration-700 hover:scale-105"
                        />
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-t from-warmDark-800/95 via-warmDark-800/40 to-transparent transition-opacity duration-500",
                            activeId === amenity.id ? "opacity-100" : "opacity-70"
                        )} />
                        <div className={cn(
                            "absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end transition-all duration-500 overflow-hidden",
                            activeId === amenity.id ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                        )}>
                            <h3 className="text-3xl font-bold text-peach-200 mb-1 leading-tight drop-shadow-lg font-display">{amenity.name}</h3>
                            <p className="font-medium tracking-wide text-base text-terra-300 drop-shadow-md">{amenity.tagline}</p>
                            <div className={cn(
                                "overflow-hidden transition-all duration-500 delay-75 ease-in-out",
                                activeId === amenity.id ? "max-h-20 mt-4 opacity-100" : "max-h-0 opacity-0"
                            )}>
                                <Link href="/facilities" className="text-xs font-bold bg-terra-400 text-peach-50 px-5 py-2.5 rounded-full hover:bg-terra-300 transition-colors uppercase tracking-wider shadow-glow inline-block">
                                    Explore Zone
                                </Link>
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
                {amenities.map((amenity) => (
                    <div
                        key={amenity.id}
                        onClick={() => {
                            setActiveId(amenity.id);
                            setHasInteracted(true);
                        }}
                        className={cn(
                            "relative overflow-hidden rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-lg border border-peach-400",
                            activeId === amenity.id ? "h-[450px]" : "h-[100px]"
                        )}
                    >
                        <Image
                            src={amenity.image}
                            alt={amenity.name}
                            fill
                            className={cn(
                                "object-cover object-center transition-transform duration-700",
                                activeId === amenity.id ? "scale-100" : "scale-110 opacity-60"
                            )}
                        />

                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-b transition-all duration-500",
                            activeId === amenity.id
                                ? "from-transparent via-warmDark-800/20 to-warmDark-800/95"
                                : "from-warmDark-800/40 via-warmDark-800/60 to-warmDark-800/80"
                        )} />

                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                            <div className={cn(
                                "transition-all duration-500",
                                activeId === amenity.id ? "mb-auto mt-auto translate-y-0" : "mb-0 translate-y-0"
                            )}>
                                <div className="flex justify-between items-center w-full">
                                    <h3 className={cn(
                                        "font-black text-peach-200 uppercase tracking-tighter transition-all duration-500 leading-none font-display",
                                        activeId === amenity.id ? "text-4xl mb-2" : "text-xl"
                                    )}>
                                        {amenity.name}
                                    </h3>
                                </div>
                            </div>

                            <div className={cn(
                                "overflow-hidden transition-all duration-500 ease-in-out gap-4 flex flex-col",
                                activeId === amenity.id ? "opacity-100 max-h-[200px] mt-4" : "opacity-0 max-h-0 mt-0"
                            )}>
                                <p className="text-peach-400 text-sm font-medium leading-relaxed">
                                    {amenity.tagline} -- purpose-built for peak performance with premium equipment and expert-guided programming.
                                </p>
                                <Link href="/facilities" className="self-start text-xs font-bold bg-terra-400 text-peach-50 px-6 py-3 rounded-full hover:bg-terra-300 transition-colors uppercase tracking-wider shadow-glow inline-block">
                                    Explore Zone
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
