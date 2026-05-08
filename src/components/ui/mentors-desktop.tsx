"use client";

import React from "react";
import { CircularTestimonials } from '@/components/ui/circular-testimonials';

// Mapping Mentors to the Circular Testimonials format
const mentors = [
    {
        name: "Swetha",
        designation: "Lead Pilates Instructor",
        quote: "Personalised Pilates guidance rooted in alignment, breath, and intention. Swetha brings years of hands-on experience helping clients move past pain, rebuild strength, and reconnect with their bodies — one mindful session at a time.",
        src: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop",
    },
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
