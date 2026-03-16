"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const MENU_ITEMS = [
    { label: "PRICING", href: "/subscription" },
    { label: "FACILITIES", href: "/facilities" },
    { label: "ABOUT US", href: "/about" },
    { label: "CONTACT US", href: "/contact" },
];

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-warmDark-800/60 backdrop-blur-sm z-40"
                    />

                    {/* Menu Container */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-peach-200 z-50 border-l border-peach-400 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-peach-400">
                            <span className="text-xl font-black tracking-wider text-olive-600 font-display">MENU</span>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-olive-400/10 flex items-center justify-center text-olive-400 hover:bg-terra-400/20 hover:text-terra-400 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Links */}
                        <div className="flex-1 overflow-y-auto py-8 px-6 flex flex-col gap-6">
                            {MENU_ITEMS.map((item, idx) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 + 0.2 }}
                                >
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className="group flex items-center justify-between py-4 border-b border-peach-400/30"
                                    >
                                        <span className="text-3xl font-black text-olive-400 group-hover:text-terra-400 transition-colors tracking-tight font-display">
                                            {item.label}
                                        </span>
                                        <span className="w-8 h-8 rounded-full border border-olive-400/20 flex items-center justify-center text-olive-400/50 group-hover:bg-terra-400 group-hover:text-peach-50 group-hover:border-transparent transition-all">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </Link>
                                </motion.div>
                            ))}

                            {/* Contact Card */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="mt-8 p-6 bg-peach-300 rounded-lg border border-peach-400"
                            >
                                <h4 className="text-xs font-bold text-olive-300 tracking-wider mb-4">CONTACT</h4>
                                <p className="text-olive-400 text-sm mb-2">hello@solpilates.com</p>
                                <p className="text-olive-400 text-sm">(212) 555-0180</p>
                            </motion.div>
                        </div>

                        {/* Footer CTA */}
                        <div className="p-6 border-t border-peach-400">
                            <button className="w-full py-4 bg-terra-400 text-peach-50 font-black text-sm tracking-wider hover:bg-terra-300 transition-colors flex items-center justify-center gap-2 shadow-glow">
                                <span>BOOK A SESSION</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
