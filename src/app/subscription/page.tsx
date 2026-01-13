'use client';

import { BentoPricing } from '@/components/ui/bento-pricing';

export default function SubscriptionPage() {
    return (
        <div className="min-h-screen bg-black py-32 px-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="container mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white uppercase">
                        Invest In Yourself
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        Transparent pricing. No hidden fees. Select the plan that fits your ambition.
                    </p>
                </div>

                <BentoPricing />

                <div className="mt-20 text-center border-t border-white/10 pt-10">
                    <p className="text-sm text-neutral-500">
                        All memberships require a 4-week commitment. Cancellations must be made 7 days prior to renewal.
                    </p>
                </div>
            </div>
        </div>
    );
}
