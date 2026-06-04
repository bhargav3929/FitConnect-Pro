'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, SparklesIcon } from 'lucide-react';
import { PLAN_CATALOG, type PlanDefinition } from '@fitconnect/shared/types/subscription';
import { useIntroClassLead } from '@/lib/hooks/useIntroClassLead';
import { callGetPricing } from '@fitconnect/shared/firebase/firestore';

function FilledCheck() {
    return (
        <div className="bg-terra-400 text-peach-50 rounded-full p-0.5 shrink-0">
            <CheckIcon className="size-3" strokeWidth={3} />
        </div>
    );
}

function FilledCheckDark() {
    return (
        <div className="bg-terra-300 text-warmDark-900 rounded-full p-0.5 shrink-0">
            <CheckIcon className="size-3" strokeWidth={3} />
        </div>
    );
}

function formatPrice(rupees: number) {
    if (rupees === 0) return 'FREE';
    return `₹${rupees.toLocaleString('en-IN')}`;
}

function priceSuffix(plan: PlanDefinition) {
    if (plan.id === 'drop_in') return '/ session';
    if (plan.id === 'kickstarter') return '/ 2 weeks';
    if (plan.durationDays === 90) return '/ quarter';
    if (plan.durationDays === 180) return '/ 6 months';
    return '';
}

function getPerClassPrice(plan: PlanDefinition): string | null {
    if (!plan.credits || plan.credits <= 1) return null;
    const perClass = Math.round(plan.price / plan.credits);
    return `≈ ₹${perClass.toLocaleString('en-IN')} / class`;
}

function SectionLabel({ label, accent }: { label: string; accent?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <span className={cn(
                'text-xs font-black uppercase tracking-[0.15em]',
                accent ? 'text-terra-400' : 'text-olive-500',
            )}>
                {label}
            </span>
            <div className={cn('flex-1 h-px', accent ? 'bg-terra-400/25' : 'bg-peach-400/30')} />
        </div>
    );
}

function IntroCard({
    plan,
    onSelect,
    cta,
    featured,
    ctaDisabled,
    displayPrice,
}: {
    plan: PlanDefinition;
    onSelect: (id: string) => void;
    cta: string;
    featured?: boolean;
    ctaDisabled?: boolean;
    displayPrice?: number;
}) {
    const price = displayPrice ?? plan.price;
    return (
        <div className={cn(
            'relative overflow-hidden rounded-2xl border flex flex-col bg-peach-50 transition-all duration-300',
            featured
                ? 'border-terra-400/50 ring-1 ring-terra-400/20 hover:ring-terra-400/40'
                : 'border-peach-400/30 hover:border-terra-400/30',
        )}>
            {featured && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-terra-400 to-transparent" />
            )}

            <div className="p-6 pb-0 flex items-center justify-between">
                <Badge className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold tracking-wider uppercase text-xs px-3">
                    {plan.name}
                </Badge>
                {featured && (
                    <span className="text-[10px] text-terra-400 font-black tracking-[0.15em] uppercase flex items-center gap-1">
                        <SparklesIcon className="size-3" />
                        Best Intro
                    </span>
                )}
            </div>

            <div className="p-6 pt-4 flex flex-col h-full">
                <div className="flex items-end gap-2 mb-1">
                    <span className="font-mono text-5xl font-bold tracking-tight text-olive-600">
                        {formatPrice(price)}
                    </span>
                    <span className="text-olive-400 text-sm font-semibold uppercase pb-2">
                        {priceSuffix(plan)}
                    </span>
                </div>

                {plan.tagline && (
                    <p className="text-olive-400 text-sm leading-relaxed mt-3 mb-5 border-b border-peach-400/20 pb-5">
                        {plan.tagline}
                    </p>
                )}

                <ul className="space-y-3 text-sm text-olive-400 flex-grow">
                    {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <FilledCheck />
                            <span className="leading-tight">{f}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-8">
                    <Button
                        onClick={() => !ctaDisabled && onSelect(plan.id)}
                        disabled={ctaDisabled}
                        aria-disabled={ctaDisabled}
                        className={cn(
                            'w-full font-bold tracking-wide h-12 rounded-xl',
                            ctaDisabled
                                ? 'bg-peach-100 text-olive-400 hover:bg-peach-100 cursor-not-allowed border border-peach-400/30'
                                : 'bg-terra-400 text-peach-50 hover:bg-terra-300',
                        )}
                    >
                        {cta}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function HighlightedMembershipCard({
    plan,
    onSelect,
    displayPrice,
}: {
    plan: PlanDefinition;
    onSelect: (id: string) => void;
    displayPrice?: number;
}) {
    const price = displayPrice ?? plan.price;
    const perClass = price > 0 && plan.credits && plan.credits > 1
        ? `≈ ₹${Math.round(price / plan.credits).toLocaleString('en-IN')} / class`
        : getPerClassPrice(plan);

    return (
        <div className={cn(
            'relative overflow-hidden flex flex-col rounded-2xl',
            'border-2 border-terra-400 bg-warmDark-800',
            'md:-translate-y-4',
            'shadow-glow-lg transition-all duration-300',
            'hover:shadow-[0_0_60px_rgba(218,96,39,0.45)]',
        )}>
            {/* Most Popular ribbon */}
            <div className="bg-terra-400 py-2.5 text-center">
                <span className="text-peach-50 text-xs font-black tracking-[0.2em] uppercase">
                    ★&nbsp;&nbsp;Most Popular&nbsp;&nbsp;★
                </span>
            </div>

            <div className="p-6 pb-0 flex items-center justify-between">
                <Badge className="bg-terra-400/20 text-terra-300 border border-terra-400/40 font-bold tracking-wider uppercase text-xs px-3">
                    {plan.name}
                </Badge>
                {plan.foundingPrice && (
                    <span className="text-[10px] text-gold-300 font-black tracking-[0.12em] uppercase">
                        Founding Offer
                    </span>
                )}
            </div>

            <div className="p-6 pt-4 flex flex-col h-full">
                <div className="mb-1">
                    <div className="flex items-end gap-1.5">
                        <span className="font-mono text-4xl font-bold tracking-tight text-peach-50">
                            {formatPrice(price)}
                        </span>
                        <span className="text-peach-300 text-xs font-semibold uppercase pb-1.5">
                            {priceSuffix(plan)}
                        </span>
                    </div>
                    {perClass && (
                        <p className="text-terra-300 text-xs font-bold uppercase tracking-widest mt-1.5">
                            {perClass}
                        </p>
                    )}
                </div>

                {plan.foundingPrice && (
                    <div className="mt-4 mb-5 rounded-xl bg-terra-400/10 border border-terra-400/25 px-4 py-3">
                        <p className="text-[10px] text-peach-400 uppercase tracking-widest font-bold mb-1">
                            Founding Member Price
                        </p>
                        <p className="text-gold-300 font-black text-2xl leading-none">
                            {formatPrice(plan.foundingPrice)}
                        </p>
                        <p className="text-peach-400 text-[10px] mt-1">
                            First 25 members only · Save {formatPrice(price - plan.foundingPrice)}
                        </p>
                    </div>
                )}

                {plan.tagline && (
                    <p className="text-peach-300 text-sm leading-relaxed mb-5 border-b border-peach-50/10 pb-5">
                        {plan.tagline}
                    </p>
                )}

                <ul className="space-y-3.5 text-sm text-peach-200 flex-grow">
                    {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <FilledCheckDark />
                            <span className="leading-tight">{f}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-8">
                    <Button
                        onClick={() => onSelect(plan.id)}
                        className="w-full font-bold tracking-wide h-12 rounded-xl bg-terra-400 text-peach-50 hover:bg-terra-300 shadow-glow"
                    >
                        SUBSCRIBE NOW
                    </Button>
                </div>
            </div>
        </div>
    );
}

function MembershipCard({
    plan,
    onSelect,
    displayPrice,
}: {
    plan: PlanDefinition;
    onSelect: (id: string) => void;
    displayPrice?: number;
}) {
    const price = displayPrice ?? plan.price;
    const perClass = getPerClassPrice(plan);

    return (
        <div className={cn(
            'relative overflow-hidden rounded-2xl border flex flex-col',
            'bg-peach-50 border-peach-400/30 transition-all duration-300',
            'hover:border-terra-400/30',
        )}>
            <div className="p-6 pb-0 flex items-center justify-between">
                <Badge className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold tracking-wider uppercase text-xs px-3">
                    {plan.name}
                </Badge>
            </div>

            <div className="p-6 pt-4 flex flex-col h-full">
                <div className="mb-1">
                    <div className="flex items-end gap-1.5">
                        <span className="font-mono text-3xl font-bold tracking-tight text-olive-600">
                            {formatPrice(price)}
                        </span>
                        <span className="text-olive-400 text-xs font-semibold uppercase pb-1.5">
                            {priceSuffix(plan)}
                        </span>
                    </div>
                    {/* Removed PerClass price */}
                    {/* {perClass && (
                        <p className="text-olive-400 text-xs font-bold uppercase tracking-widest mt-1.5">
                            {perClass}
                        </p>
                    )} */}
                </div>

                {plan.foundingPrice && (
                    <div className="mt-4 mb-5 rounded-xl bg-terra-400/5 border border-terra-400/20 px-4 py-3">
                        <p className="text-[10px] text-olive-400 uppercase tracking-widest font-bold mb-1">
                            Founding Member
                        </p>
                        <p className="text-terra-400 font-black text-xl leading-none">
                            {formatPrice(plan.foundingPrice)}
                        </p>
                        <p className="text-olive-300 text-[10px] mt-1">
                            First 25 only · Save {formatPrice(price - plan.foundingPrice)}
                        </p>
                    </div>
                )}

                {plan.tagline && (
                    <p className="text-olive-300 text-sm leading-relaxed mb-5 border-b border-peach-400/20 pb-5">
                        {plan.tagline}
                    </p>
                )}

                <ul className="space-y-3 text-sm text-olive-400 flex-grow">
                    {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <FilledCheck />
                            <span className="leading-tight">{f}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-8">
                    <Button
                        onClick={() => onSelect(plan.id)}
                        className="w-full font-bold tracking-wide h-12 rounded-xl bg-terra-400 text-peach-50 hover:bg-terra-300"
                    >
                        SUBSCRIBE
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function BentoPricing() {
    const router = useRouter();
    const { hasIntroClassLead } = useIntroClassLead();
    const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});

    useEffect(() => {
        callGetPricing()
            .then(data => {
                const overrides: Record<string, number> = {};
                for (const p of data.plans) {
                    if (p.configured) overrides[p.planId] = p.price;
                }
                setPriceOverrides(overrides);
            })
            .catch(() => {/* use hardcoded fallback */});
    }, []);

    const handleSelect = (planId: string) => {
        if (planId === 'drop_in') {
            if (hasIntroClassLead === true) return;
            router.push('/intro-class');
            return;
        }
        router.push(`/user/subscribe?plan=${planId}`);
    };

    const dropIn = PLAN_CATALOG.find((p) => p.id === 'drop_in')!;
    const kickstarter = PLAN_CATALOG.find((p) => p.id === 'kickstarter')!;
    const memberships = PLAN_CATALOG.filter((p) => p.category === 'membership');

    return (
        <div className="space-y-24">
            {/* SECTION 1: TRY IT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <IntroCard
                    plan={dropIn}
                    onSelect={handleSelect}
                    cta={hasIntroClassLead === true ? 'INTRO CLASS BOOKED' : 'BOOK INTRO CLASS'}
                    ctaDisabled={hasIntroClassLead === true}
                    displayPrice={priceOverrides[dropIn.id]}
                />
                <IntroCard
                    plan={kickstarter}
                    onSelect={handleSelect}
                    cta="START KICKSTARTER"
                    featured
                    displayPrice={priceOverrides[kickstarter.id]}
                />
            </div>

            {/* SECTION 2: MEMBERSHIPS */}
            <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-10 bg-terra-400/40" />
                    <h2 className="text-3xl md:text-4xl font-black tracking-normal uppercase text-terra-400 font-display">
                        Memberships
                    </h2>
                    <div className="h-px w-10 bg-terra-400/40" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pt-4">
                    {memberships.map((plan) =>
                        plan.recommended ? (
                            <HighlightedMembershipCard
                                key={plan.id}
                                plan={plan}
                                onSelect={handleSelect}
                                displayPrice={priceOverrides[plan.id]}
                            />
                        ) : (
                            <MembershipCard
                                key={plan.id}
                                plan={plan}
                                onSelect={handleSelect}
                                displayPrice={priceOverrides[plan.id]}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
