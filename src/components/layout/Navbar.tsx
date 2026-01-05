"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dumbbell, Menu } from "lucide-react";

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
                <Link href="/" className="flex items-center space-x-2 group">
                    <div className="p-2 bg-navy-800/50 rounded-lg backdrop-blur-sm group-hover:bg-navy-800/80 transition-colors border border-white/10">
                        <Dumbbell className="h-6 w-6 text-lime-400" />
                    </div>
                    <span className="font-bold text-2xl tracking-tighter text-white italic">FitConnect</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link href="/" className="text-sm font-bold uppercase tracking-wider text-white/80 hover:text-lime-400 transition-colors">
                        Home
                    </Link>
                    <Link href="/gyms" className="text-sm font-bold uppercase tracking-wider text-white/80 hover:text-lime-400 transition-colors">
                        Coaching
                    </Link>
                    <Link href="/events" className="text-sm font-bold uppercase tracking-wider text-white/80 hover:text-lime-400 transition-colors">
                        Events
                    </Link>
                    <Link href="/subscription" className="text-sm font-bold uppercase tracking-wider text-white/80 hover:text-lime-400 transition-colors">
                        Pages
                    </Link>
                    <Link href="/blog" className="text-sm font-bold uppercase tracking-wider text-white/80 hover:text-lime-400 transition-colors">
                        Blog
                    </Link>
                </div>

                {/* Auth Actions */}
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-bold text-white hidden md:inline-block">
                                Hi, {user.displayName?.split(' ')[0]}
                            </span>
                            <Button variant="ghost" className="text-white hover:text-lime-400 font-bold uppercase tracking-wider" onClick={() => logOut()}>
                                Log out
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="hidden sm:block">
                                <LoginModal trigger={
                                    <Button variant="ghost" className="text-white hover:text-lime-400 font-bold uppercase tracking-wider">
                                        Login
                                    </Button>
                                } />
                            </div>
                            <div>
                                <SignupModal trigger={
                                    <Button className="bg-lime-400 text-navy-900 hover:bg-lime-500 font-black uppercase tracking-wider text-xs px-6 py-5 rounded-full shadow-[0_0_20px_rgba(223,255,0,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(223,255,0,0.5)]">
                                        Join Membership
                                    </Button>
                                } />
                            </div>
                        </>
                    )}

                    {/* Mobile Menu */}
                    <Button variant="ghost" size="icon" className="md:hidden text-white hover:text-lime-400" onClick={toggleSidebar}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </nav>
    );
}
