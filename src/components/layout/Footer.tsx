"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Mail } from 'lucide-react';
import { Reveal } from '@/lib/animation/Reveal';

const SOL_INSTAGRAM_URL = "https://instagram.com/pilates.with.swetha";

const COPY = {
    watermark: "SOL PILATES",
    logoAlt: "SOL Pilates Studio",
    brandTagline:
        "Contrology-based Pilates inside Tavaro Resorts, Hyderabad. Strength-led. Pain-free. Built to last.",
    instagramAriaLabel: "Instagram",
    servicesHeading: "SERVICES",
    servicesLinks: [
        { label: "Sol Flow", href: "/subscription" },
        { label: "Sol Cardio", href: "/subscription" },
        { label: "Sol Stretch", href: "/subscription" },
    ],
    studioHeading: "STUDIO",
    studioLinks: [
        { label: "Our Story", href: "/our-story" },
        { label: "Contact", href: "/contact" },
    ],
    legalHeading: "LEGAL",
    legalLinks: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility"],
    newsletterHeading: "STAY CONNECTED",
    newsletterBody:
        "Be the first to know about classes, founding member spots and studio updates.",
    newsletterPlaceholder: "Enter your email",
    newsletterCta: "Subscribe",
    copyright: "SOL Pilates Studio. All rights reserved.",
    bottomLinks: ["Privacy", "Terms", "Sitemap"],
};

export function Footer() {
    return (
        <Reveal variant="slideUp" as="footer" duration={0.8} className="bg-warmDark-800 text-peach-200 py-20 relative overflow-hidden">
            {/* Cinematic Watermark */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none select-none flex items-center justify-center opacity-[0.03]">
                <span className="text-[15vw] md:text-[20vw] font-black uppercase tracking-normal text-peach-200 stroke-text leading-none whitespace-nowrap font-display">
                    {COPY.watermark}
                </span>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

                    {/* 1. Brand Section (Left) - Spans 4 columns */}
                    <div className="lg:col-span-4 space-y-8">
                        <Link href="/" className="inline-block group">
                            <Image
                                src="/images/sol-logo-terra.png"
                                alt={COPY.logoAlt}
                                width={400}
                                height={400}
                                className="h-28 md:h-32 w-auto group-hover:opacity-80 transition-opacity duration-300"
                            />
                        </Link>
                        <p className="text-peach-400 leading-relaxed max-w-sm font-medium">
                            {COPY.brandTagline}
                        </p>
                        {/* <div className="flex gap-4">
                            <a
                                href={SOL_INSTAGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={COPY.instagramAriaLabel}
                                className="w-10 h-10 rounded-full bg-peach-200/5 border border-peach-200/10 flex items-center justify-center text-peach-200 hover:bg-terra-400 hover:text-peach-50 hover:border-terra-400 hover:scale-110 transition-all duration-300"
                            >
                                <Instagram className="w-4 h-4" />
                            </a>
                        </div> */}
                    </div>

                    {/* 2. Links Section (Center) - Spans 5 columns */}
                    <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <h4 className="font-bold text-peach-200 mb-6 tracking-wide">{COPY.servicesHeading}</h4>
                            <ul className="space-y-4">
                                {COPY.servicesLinks.map(item => (
                                    <li key={item.label}>
                                        <Link href={item.href} className="text-sm text-peach-400 hover:text-terra-300 transition-colors block hover:translate-x-1 duration-200 py-1.5">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-peach-200 mb-6 tracking-wide">{COPY.studioHeading}</h4>
                            <ul className="space-y-4">
                                {COPY.studioLinks.map(item => (
                                    <li key={item.label}>
                                        <Link href={item.href} className="text-sm text-peach-400 hover:text-terra-300 transition-colors block hover:translate-x-1 duration-200 py-1.5">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-peach-200 mb-6 tracking-wide">{COPY.legalHeading}</h4>
                            <ul className="space-y-4">
                                {COPY.legalLinks.map(item => (
                                    <li key={item}>
                                        <button type="button" className="text-sm text-peach-400 hover:text-terra-300 transition-colors block hover:translate-x-1 duration-200 py-1.5 text-left w-full">
                                            {item}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* 3. Newsletter Section (Right) - Spans 3 columns */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="font-bold text-peach-200 tracking-wide">{COPY.newsletterHeading}</h4>
                        <p className="text-sm text-peach-400">
                            {COPY.newsletterBody}
                        </p>
                        <form className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-peach-400 group-focus-within:text-terra-400 transition-colors" />
                            <input
                                type="email"
                                placeholder={COPY.newsletterPlaceholder}
                                className="w-full bg-peach-200/5 border border-peach-200/10 rounded-full py-4 pl-12 pr-4 text-sm text-peach-200 placeholder:text-peach-400 focus:outline-none focus:border-terra-400/40 focus:bg-peach-200/10 transition-all"
                            />
                            <button className="absolute right-1 top-1 bottom-1 bg-terra-400 text-peach-50 px-6 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-terra-300 transition-colors">
                                {COPY.newsletterCta}
                            </button>
                        </form>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-peach-200/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-peach-400 font-medium">
                        &copy; {new Date().getFullYear()} {COPY.copyright}
                    </p>
                    <div className="flex gap-6">
                        {COPY.bottomLinks.map((label, idx) => (
                            <span key={label} className="flex items-center gap-6">
                                <button type="button" className="text-xs text-peach-400 hover:text-terra-300 transition-colors font-medium">{label}</button>
                                {idx < COPY.bottomLinks.length - 1 && (
                                    <span className="text-warmDark-700">&bull;</span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </Reveal>
    );
}
