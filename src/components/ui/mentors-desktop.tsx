"use client";

import React from "react";
import { CircularTestimonials } from '@/components/ui/circular-testimonials';

// Mapping Mentors to the Circular Testimonials format
const mentors = [
    {
        name: "Marcus Cole",
        designation: "Reformer Specialist",
        quote: "Specialising in Footwork, Long Stretch, and Elephant sequences. 10+ years of reformer experience guiding you through controlled, intentional movements that build lasting strength from the inside out.",
        src: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop",
    },
    {
        name: "Elena Fox",
        designation: "Mat Pilates Lead",
        quote: "Master of The Hundred, Roll-Up, and Teaser progressions. Classical mat Pilates instructor known for transformative sessions that reshape your entire body through precision and breath.",
        src: "https://images.unsplash.com/photo-1611672585731-fa10603fb9e0?q=80&w=600&auto=format&fit=crop",
    },
    {
        name: "David Stone",
        designation: "Strength & Core",
        quote: "Expert in Plank Series, Side Kick, and Leg Pull variations. Pilates-based strength coach specialising in functional movement and deep core stability — true strength is about control.",
        src: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=600&auto=format&fit=crop",
    },
    {
        name: "Sarah Jen",
        designation: "Barre & Flexibility",
        quote: "Teaching Spine Stretch, Swan Dive, and Mermaid flows. Former dancer focusing on barre-fusion and flexibility — unlock the freedom and elegance your body was designed for.",
        src: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=600&auto=format&fit=crop",
    },
    {
        name: "Maya Lee",
        designation: "Prenatal & Restorative",
        quote: "Guiding Pelvic Curl, Cat-Cow, and Side Lying sequences. Specialist in prenatal Pilates and restorative movement — gentle, purposeful sessions designed for every stage of life.",
        src: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop",
    }
];

export default function MentorsDesktop() {
    return (
        <div className="hidden md:flex justify-center items-center py-0">
            <CircularTestimonials
                testimonials={mentors}
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
    );
}
