"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./MobileMenu";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-peach-200/80 backdrop-blur-md border-b border-peach-400">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="relative z-50">
                        <Image
                            src="/images/sol-logo-terra.png"
                            alt="SOL Pilates Studio"
                            width={400}
                            height={400}
                            className="h-28 md:h-32 w-auto -my-8 md:-my-10"
                        />
                    </Link>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="#" className="nav-link group flex items-center gap-1 text-olive-400 font-medium text-sm tracking-wider">
                            HOME <span className="text-[10px] opacity-50 group-hover:translate-y-0.5 transition-transform">&#9660;</span>
                        </Link>
                        <Link href="/subscription" className="text-olive-300 font-medium hover:text-terra-400 transition-colors text-sm tracking-wider">
                            PRICING
                        </Link>
                        <Link href="/facilities" className="text-olive-300 font-medium hover:text-terra-400 transition-colors text-sm tracking-wider">
                            FACILITIES
                        </Link>
                        <Link href="/about" className="text-olive-300 font-medium hover:text-terra-400 transition-colors text-sm tracking-wider">
                            ABOUT US
                        </Link>
                        <Link href="/contact" className="text-olive-300 font-medium hover:text-terra-400 transition-colors text-sm tracking-wider">
                            CONTACT US
                        </Link>
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        <button className="hidden md:block px-6 py-3 border border-terra-400 text-terra-400 font-bold text-sm tracking-wider hover:bg-terra-400 hover:text-peach-50 transition-all">
                            BOOK NOW
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 group p-2 hover:bg-olive-400/10 rounded-full transition-colors"
                        >
                            <span className="w-6 h-0.5 bg-olive-400 group-hover:scale-x-75 transition-transform origin-right"></span>
                            <span className="w-6 h-0.5 bg-olive-400"></span>
                            <span className="w-6 h-0.5 bg-olive-400 group-hover:scale-x-75 transition-transform origin-right"></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
}
