"use client"

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

import { useAuth } from "@/lib/hooks/useAuth";
import { useUIStore } from "@/lib/store/uiStore";
import { LoginModal } from "@/components/auth/LoginModal";
import { SignupModal } from "@/components/auth/SignupModal";

export function Navbar() {
    const { user, logOut } = useAuth();
    const { toggleSidebar } = useUIStore();

    return (
        <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent py-4">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="inline-block group">
                    <Image
                        src="/images/sol-logo-terra.png"
                        alt="SOL Pilates Studio"
                        width={400}
                        height={400}
                        className="h-20 md:h-24 w-auto group-hover:opacity-80 transition-opacity"
                    />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link href="/" className="text-sm font-bold uppercase tracking-wider text-olive-400/80 hover:text-terra-400 transition-colors">
                        Home
                    </Link>
                    <Link href="/facilities" className="text-sm font-bold uppercase tracking-wider text-olive-400/80 hover:text-terra-400 transition-colors">
                        Our Facility
                    </Link>
                    <Link href="/events" className="text-sm font-bold uppercase tracking-wider text-olive-400/80 hover:text-terra-400 transition-colors">
                        Events
                    </Link>
                    <Link href="/subscription" className="text-sm font-bold uppercase tracking-wider text-olive-400/80 hover:text-terra-400 transition-colors">
                        Pages
                    </Link>
                    <Link href="/blog" className="text-sm font-bold uppercase tracking-wider text-olive-400/80 hover:text-terra-400 transition-colors">
                        Blog
                    </Link>
                </div>

                {/* Auth Actions */}
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-bold text-olive-400 hidden md:inline-block">
                                Hi, {user.displayName?.split(' ')[0]}
                            </span>
                            <Button variant="ghost" className="text-olive-400 hover:text-terra-400 font-bold uppercase tracking-wider" onClick={() => logOut()}>
                                Log out
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="hidden sm:block">
                                <LoginModal trigger={
                                    <Button variant="ghost" className="text-olive-400 hover:text-terra-400 font-bold uppercase tracking-wider">
                                        Login
                                    </Button>
                                } />
                            </div>
                            <div>
                                <SignupModal trigger={
                                    <Button className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-black uppercase tracking-wider text-xs px-6 py-5 rounded-full shadow-glow transition-all hover:scale-105 hover:shadow-glow-lg">
                                        Join Membership
                                    </Button>
                                } />
                            </div>
                        </>
                    )}

                    {/* Mobile Menu */}
                    <Button variant="ghost" size="icon" className="md:hidden text-olive-400 hover:text-terra-400" onClick={toggleSidebar}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </nav>
    );
}
