"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function ShopPage() {
    return (
        <div className="min-h-screen bg-peach-200">
            <section className="relative pt-40 pb-20 bg-warmDark-800 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                    <span className="text-[20vw] font-black text-peach-200 whitespace-nowrap font-display">SHOP</span>
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black text-peach-200 tracking-normal font-display">
                            SOL SHOP
                        </h1>
                        <p className="text-peach-400 mt-4 max-w-lg mx-auto tracking-wider text-sm">
                            MERCHANDISE, MATS &amp; MOMENTUM
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="container mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-2xl mx-auto bg-peach-50 border border-peach-400/40 rounded-2xl p-12 text-center"
                >
                    <div className="w-20 h-20 mx-auto rounded-full bg-terra-400/10 flex items-center justify-center mb-6">
                        <ShoppingBag className="w-9 h-9 text-terra-400" strokeWidth={1.5} />
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full bg-terra-400/10 text-terra-400 text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
                        Coming Soon
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-olive-600 tracking-normal font-display mb-4 uppercase">
                        Studio Merch Is On The Way
                    </h2>
                    <p className="text-olive-400 leading-relaxed mb-8">
                        We&apos;re curating a small line of apparel, mats, and accessories crafted to match the studio&apos;s feel. Sign up below and we&apos;ll email you the moment the shop opens.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-terra-400 text-peach-50 font-bold text-xs tracking-[0.15em] uppercase hover:bg-terra-300 transition-colors rounded-xl"
                    >
                        Notify Me
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>
        </div>
    );
}
