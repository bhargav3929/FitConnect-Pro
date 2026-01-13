"use client";
import Link from 'next/link';
import { Dumbbell, Instagram, Twitter, Facebook, Youtube, Linkedin, Mail } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-black text-white py-20 relative overflow-hidden">
            {/* Cinematic Watermark */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none select-none flex items-center justify-center opacity-[0.03]">
                <span className="text-[15vw] md:text-[20vw] font-black uppercase tracking-tighter text-white stroke-text leading-none whitespace-nowrap">
                    FITCONNECT
                </span>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

                    {/* 1. Brand Section (Left) - Spans 4 columns */}
                    <div className="lg:col-span-4 space-y-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                                <Dumbbell className="w-6 h-6 fill-current" />
                            </div>
                            <span className="text-2xl font-black tracking-tight group-hover:text-neutral-300 transition-colors">FITCONNECT PRO.</span>
                        </Link>
                        <p className="text-neutral-400 leading-relaxed max-w-sm font-medium">
                            Empowering elite performance through connected luxury fitness. Join the revolution that's redefining what's possible.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { icon: Instagram, href: "#" },
                                { icon: Twitter, href: "#" },
                                { icon: Linkedin, href: "#" },
                                { icon: Youtube, href: "#" }
                            ].map((social, i) => (
                                <Link
                                    key={i}
                                    href={social.href}
                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black hover:scale-110 transition-all duration-300"
                                >
                                    <social.icon className="w-4 h-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* 2. Links Section (Center) - Spans 5 columns */}
                    <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <h4 className="font-bold text-white mb-6 tracking-wide">PLATFORM</h4>
                            <ul className="space-y-4">
                                {["Virtual Training", "Exclusive Content", "Wearable Integration", "Performance Analytics"].map(item => (
                                    <li key={item}>
                                        <Link href="#" className="text-sm text-neutral-400 hover:text-white transition-colors block hover:translate-x-1 duration-200">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-6 tracking-wide">COMPANY</h4>
                            <ul className="space-y-4">
                                {["About Us", "Our Coaches", "Careers", "Press"].map(item => (
                                    <li key={item}>
                                        <Link href="#" className="text-sm text-neutral-400 hover:text-white transition-colors block hover:translate-x-1 duration-200">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Hidden on very small screens if needed, but keeping for completeness */}
                        <div>
                            <h4 className="font-bold text-white mb-6 tracking-wide">LEGAL</h4>
                            <ul className="space-y-4">
                                {["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility"].map(item => (
                                    <li key={item}>
                                        <Link href="#" className="text-sm text-neutral-400 hover:text-white transition-colors block hover:translate-x-1 duration-200">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* 3. Newsletter Section (Right) - Spans 3 columns */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="font-bold text-white tracking-wide">STAY CONNECTED</h4>
                        <p className="text-sm text-neutral-400">
                            Get early access to new features and exclusive fitness drops.
                        </p>
                        <form className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                            />
                            <button className="absolute right-1 top-1 bottom-1 bg-white text-black px-6 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors">
                                Subscribe
                            </button>
                        </form>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-neutral-500 font-medium">
                        &copy; {new Date().getFullYear()} FitConnect Pro. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-xs text-neutral-500 hover:text-white transition-colors font-medium">Privacy</Link>
                        <span className="text-neutral-800">•</span>
                        <Link href="#" className="text-xs text-neutral-500 hover:text-white transition-colors font-medium">Terms</Link>
                        <span className="text-neutral-800">•</span>
                        <Link href="#" className="text-xs text-neutral-500 hover:text-white transition-colors font-medium">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
