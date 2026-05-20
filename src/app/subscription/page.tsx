'use client';

import { motion } from "framer-motion";
import { BentoPricing } from '@/components/ui/bento-pricing';

export default function SubscriptionPage() {
    return (
        <div className="min-h-screen bg-peach-200">
            {/* Hero */}
            <section className="relative pt-40 pb-20 bg-warmDark-800 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                    <span className="text-[20vw] font-black text-peach-200 whitespace-nowrap font-display">Pricing</span>
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black text-peach-200 tracking-normal font-display">
                            INVEST IN YOURSELF
                        </h1>
                        <p className="text-peach-400 mt-4 mx-auto tracking-wider text-sm">
                            Transparent pricing. No hidden fees. Select the plan that fits your ambition.
                        </p>
                    </motion.div>
                </div>
            </section>
            <div className="min-h-screen bg-peach-200 py-32 px-4 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-terra-400/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-terra-400/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="container mx-auto relative z-10">
                    {/* <div className="text-center max-w-3xl mx-auto mb-20">
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6 text-olive-600 uppercase font-display">
                            Invest In Yourself
                        </h1>
                        <p className="text-xl text-olive-300 md:whitespace-nowrap md:max-w-none mx-auto max-w-2xl">
                            Transparent pricing. No hidden fees. Select the plan that fits your ambition.
                        </p>
                    </div> */}

                    <BentoPricing />

                    <div className="mt-20 text-center border-t border-peach-400/20 pt-10">
                        <p className="text-sm text-olive-400">
                            All memberships require a 4-week commitment. Cancellations must be made 7 days prior to renewal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
