"use client";

import React from "react";
import { CircularTestimonials } from '@/components/ui/circular-testimonials';

// Mapping Mentors to the Circular Testimonials format
const mentors = [
    {
        name: "Marcus Cole",
        designation: "Crossfit Master",
        quote: "Elite strength conditioning coach with 10+ years experience training competitive athletes. I push you past your limits to discover what you're truly capable of.",
        src: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop",
    },
    {
        name: "Elena Fox",
        designation: "Aerobics Lead",
        quote: "High-energy rhythm cycling and aerobics instructor known for sold-out classes. Join me to sweat, dance, and transform your cardio endurance.",
        src: "https://images.unsplash.com/photo-1611672585731-fa10603fb9e0?q=80&w=600&auto=format&fit=crop",
    },
    {
        name: "David Stone",
        designation: "Pure Strength",
        quote: "Powerlifting champion specializing in hypertrophy and functional strength gains. Building muscle isn't just about lifting heavy; it's about lifting smart.",
        src: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=600&auto=format&fit=crop",
    },
    {
        name: "Sarah Jen",
        designation: "Gymnastics",
        quote: "Former olympian focusing on mobility, flexibility, and callisthenics mastery. Unlock the freedom of movement your body was designed for.",
        src: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=600&auto=format&fit=crop",
    },
    {
        name: "Maya Lee",
        designation: "Yoga Flow",
        quote: "Certified Vinyasa expert connecting mind and body through fluid movement. Find your center and build core strength in my dynamic flow sessions.",
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
                    name: "#ffffff",
                    designation: "#a3a3a3",
                    testimony: "#e5e5e5",
                    arrowBackground: "#262626",
                    arrowForeground: "#ffffff",
                    arrowHoverBackground: "#ffffff",
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
