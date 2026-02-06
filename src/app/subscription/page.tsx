'use client';

import { BentoPricing } from '@/components/ui/bento-pricing';

export default function SubscriptionPage() {
    return (
        <div className="min-h-screen bg-[#0B0F19] py-32 px-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-coral-400/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-coral-400/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="container mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white uppercase">
                        Invest In Yourself
                    </h1>
                    <p className="text-xl text-[#8892A4] max-w-2xl mx-auto">
                        Transparent pricing. No hidden fees. Select the plan that fits your ambition.
                    </p>
                </div>

                <BentoPricing />

                <div className="mt-20 text-center border-t border-[#1A2238] pt-10">
                    <p className="text-sm text-[#5A6478]">
                        All memberships require a 4-week commitment. Cancellations must be made 7 days prior to renewal.
                    </p>
                </div>
            </div>
        </div>
    );
}
