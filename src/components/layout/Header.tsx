"use client";

import { useState } from "react";
import Link from "next/link";
import { MobileMenu } from "./MobileMenu";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="relative z-50">
                        <div className="text-2xl font-black tracking-wider text-white">
                            FITPRO
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="#" className="nav-link group flex items-center gap-1 text-white font-medium text-sm tracking-wider">
                            HOME <span className="text-[10px] opacity-50 group-hover:translate-y-0.5 transition-transform">▼</span>
                        </Link>
                        <Link href="/subscription" className="text-white/70 font-medium hover:text-white transition-colors text-sm tracking-wider">
                            PRICING
                        </Link>
                        <Link href="/facilities" className="text-white/70 font-medium hover:text-white transition-colors text-sm tracking-wider">
                            FACILITIES
                        </Link>
                        <Link href="/about" className="text-white/70 font-medium hover:text-white transition-colors text-sm tracking-wider">
                            ABOUT US
                        </Link>
                        <Link href="/contact" className="text-white/70 font-medium hover:text-white transition-colors text-sm tracking-wider">
                            CONTACT US
                        </Link>
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        <button className="hidden md:block px-6 py-3 border border-white text-white font-bold text-sm tracking-wider hover:bg-white hover:text-black transition-all">
                            BOOK NOW
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 group p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <span className="w-6 h-0.5 bg-white group-hover:scale-x-75 transition-transform origin-right"></span>
                            <span className="w-6 h-0.5 bg-white"></span>
                            <span className="w-6 h-0.5 bg-white group-hover:scale-x-75 transition-transform origin-right"></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
}
