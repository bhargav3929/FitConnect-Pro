'use client';
import React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, SparklesIcon } from 'lucide-react';

type PricingCardProps = {
    titleBadge: string;
    priceLabel: string;
    priceSuffix?: string;
    subLabel?: string;
    features: string[];
    cta?: string;
    className?: string;
    description?: string;
};

function FilledCheck() {
    return (
        <div className="bg-white text-black rounded-full p-0.5 shrink-0">
            <CheckIcon className="size-3" strokeWidth={3} />
        </div>
    );
}

function PricingCard({
    titleBadge,
    priceLabel,
    priceSuffix = '',
    subLabel = '',
    description = '',
    features,
    cta = 'Subscribe',
    className,
}: PricingCardProps) {
    return (
        <div
            className={cn(
                'bg-white/5 border-white/10 relative overflow-hidden rounded-2xl border flex flex-col',
                'hover:border-white/20 transition-all duration-300',
                className,
            )}
        >
            <div className="flex items-center gap-3 p-6 pb-2">
                <Badge variant="secondary" className="bg-white text-black hover:bg-white/90 font-bold tracking-wider">{titleBadge}</Badge>
            </div>

            <div className="p-6 pt-2">
                <div className="flex items-end gap-2 mb-2">
                    <span className="font-mono text-5xl font-bold tracking-tight text-white">
                        {priceLabel}
                    </span>
                    <div className="flex flex-col leading-none pb-2">
                        {priceSuffix && (
                            <span className="text-white/40 text-sm font-semibold uppercase">{priceSuffix}</span>
                        )}
                        {subLabel && (
                            <span className="text-white/40 text-[10px] font-bold uppercase">{subLabel}</span>
                        )}
                    </div>
                </div>
                {description && (
                    <p className="text-white/60 text-sm leading-relaxed mb-6 border-b border-white/10 pb-6">
                        {description}
                    </p>
                )}

                <ul className="text-white/60 space-y-4 text-sm mt-2 flex-grow">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <FilledCheck />
                            <span className="leading-tight">{f}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-8">
                    <Button className="w-full bg-white text-black hover:bg-neutral-200 font-bold tracking-wide h-12 rounded-xl">{cta}</Button>
                </div>
            </div>
        </div>
    );
}

export function BentoPricing() {
    return (
        <div className="space-y-20">
            {/* SECTION 1: MEMBERSHIPS */}
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">Memberships</h2>
                    <p className="text-white/40 max-w-2xl mx-auto">Flexible plans for your consistent training.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 2. Unlimited - Featured in center conceptually, but keeping grid order. Or maybe making it consistent. */}
                    <div
                        className={cn(
                            'bg-white/5 border-white/10 relative w-full overflow-hidden rounded-2xl border flex flex-col',
                            'md:col-span-1 ring-1 ring-white/20', // Highlighted
                        )}
                    >
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>
                        <div className="flex items-center gap-3 p-6 pb-2">
                            <Badge variant="secondary" className="bg-white text-black hover:bg-white/90 font-bold tracking-wider">UNLIMITED</Badge>
                            <Badge variant="outline" className="ml-auto border-white/20 text-white text-[10px] uppercase tracking-widest hidden lg:flex">
                                <SparklesIcon className="me-1 size-3" /> Popular
                            </Badge>
                        </div>
                        <div className="p-6 pt-2 flex flex-col h-full">
                            <div className="pb-4">
                                <div className="flex items-end gap-2">
                                    <span className="font-mono text-5xl font-bold tracking-tight text-white">
                                        $200
                                    </span>
                                    <div className="flex flex-col leading-none pb-2">
                                        <span className="text-white/40 text-sm font-semibold uppercase">/4 WEEKS</span>
                                        <span className="text-green-400 text-[10px] font-bold uppercase">Best Value</span>
                                    </div>
                                </div>
                                <p className="text-white/60 text-sm mt-4 border-b border-white/10 pb-6">
                                    Book as many sessions as you'd like. The ultimate commitment to your fitness journey.
                                </p>
                            </div>
                            <ul className="text-white/60 space-y-4 text-sm flex-grow">
                                {[
                                    'Unlimited classes every 4 weeks',
                                    '14-day advance booking window',
                                    'Membership auto-renews every 4 weeks',
                                    'Priority support'
                                ].map((f, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <FilledCheck />
                                        <span className="leading-tight">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8">
                                <Button className="w-full bg-white text-black hover:bg-neutral-200 font-bold tracking-wide h-12 rounded-xl">SUBSCRIBE NOW</Button>
                            </div>
                        </div>
                    </div>

                    <PricingCard
                        titleBadge="TWICE WEEKLY"
                        priceLabel="$160"
                        priceSuffix="/ 4 WEEKS"
                        subLabel="8 classes"
                        description="Book up to 8 sessions every 4 weeks. Perfect for consistent maintenance."
                        features={[
                            '8 classes every 4 weeks',
                            '14-day advance booking window',
                            'Membership auto-renews every 4 weeks',
                            'Roll-over unused credits (up to 2)'
                        ]}
                    />

                    <PricingCard
                        titleBadge="ONCE WEEKLY"
                        priceLabel="$120"
                        priceSuffix="/ 4 WEEKS"
                        subLabel="4 classes"
                        description="Book up to 4 sessions every 4 weeks. Great for supplementing other training."
                        features={[
                            '4 classes every 4 weeks',
                            '14-day advance booking window',
                            'Membership auto-renews every 4 weeks'
                        ]}
                    />
                </div>
            </div>

            {/* SECTION 2: SESSIONS */}
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase">Class Packs</h2>
                    <p className="text-white/40 max-w-2xl mx-auto">No commitment. Just train.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
                    <PricingCard
                        titleBadge="DROP-IN"
                        priceLabel="$35"
                        priceSuffix="/ CLASS"
                        subLabel="1 Credit"
                        description="Drop-In credit for one session - Live, Virtual, or On-Demand."
                        features={[
                            '1 Session Credit',
                            '1 Month Expiration',
                            'Valid for any standard class',
                        ]}
                        cta="BUY PASS"
                    />

                    <PricingCard
                        titleBadge="5 PACK"
                        priceLabel="$160"
                        priceSuffix="/ 5 CLASSES"
                        subLabel="$32/class"
                        description="5 drop-in credits. Perfect for occasional visitors."
                        features={[
                            '5 Session Credits',
                            '6 Month Expiration',
                            'Valid for any standard class',
                            'Shareable with 1 friend'
                        ]}
                        cta="BUY PACK"
                    />

                    <PricingCard
                        titleBadge="10 PACK"
                        priceLabel="$300"
                        priceSuffix="/ 10 CLASSES"
                        subLabel="$30/class"
                        description="10 drop-in session credits. Commit to a block of training."
                        features={[
                            '10 Session Credits',
                            '6 Month Expiration',
                            'Valid for any standard class',
                            'Shareable with 2 friends'
                        ]}
                        cta="BUY PACK"
                    />
                </div>
            </div>
        </div>
    );
}
