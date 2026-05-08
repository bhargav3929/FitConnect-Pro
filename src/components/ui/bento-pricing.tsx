'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, SparklesIcon } from 'lucide-react';
import { PLAN_CATALOG, type PlanDefinition } from '@fitconnect/shared/types/subscription';
import { useFreeClassLead } from '@/lib/hooks/useFreeClassLead';

function FilledCheck() {
    return (
        <div className="bg-terra-400 text-peach-50 rounded-full p-0.5 shrink-0">
            <CheckIcon className="size-3" strokeWidth={3} />
        </div>
    );
}

function formatPrice(rupees: number) {
    if (rupees === 0) return 'FREE';
    return `₹${rupees.toLocaleString('en-IN')}`;
}

function priceSuffix(plan: PlanDefinition) {
    if (plan.id === 'drop_in') return '/ 30 MIN';
    if (plan.id === 'kickstarter') return '/ 2 WEEKS';
    if (plan.durationDays === 90) return '/ QUARTER';
    if (plan.durationDays === 180) return '/ 6 MONTHS';
    return '';
}

function PlanCard({
    plan,
    onSelect,
    cta,
    featured,
    ctaDisabled,
}: {
    plan: PlanDefinition;
    onSelect: (id: string) => void;
    cta: string;
    featured?: boolean;
    ctaDisabled?: boolean;
}) {
    return (
        <div
            className={cn(
                'bg-peach-50 border-peach-400/20 relative overflow-hidden rounded-2xl border flex flex-col',
                'hover:border-terra-400/30 transition-all duration-300',
                featured && 'ring-1 ring-terra-400/30',
            )}
        >
            {featured && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-terra-400/50 to-transparent opacity-50" />
            )}
            <div className="flex items-center gap-3 p-6 pb-2">
                <Badge variant="secondary" className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold tracking-wider uppercase">
                    {plan.name}
                </Badge>
                {plan.recommended && (
                    <Badge variant="outline" className="ml-auto border-terra-400/30 text-terra-400 text-[10px] uppercase tracking-widest hidden lg:flex">
                        <SparklesIcon className="me-1 size-3" /> Popular
                    </Badge>
                )}
            </div>

            <div className="p-6 pt-2 flex flex-col h-full">
                <div className="flex items-end gap-2 mb-2">
                    <span className="font-mono text-5xl font-bold tracking-tight text-olive-600">
                        {formatPrice(plan.price)}
                    </span>
                    <div className="flex flex-col leading-none pb-2">
                        <span className="text-olive-400 text-sm font-semibold uppercase">{priceSuffix(plan)}</span>
                        {plan.credits !== null && plan.credits > 1 && (
                            <span className="text-olive-300 text-[10px] font-bold uppercase">{plan.credits} classes</span>
                        )}
                    </div>
                </div>
                {plan.foundingPrice && (
                    <div className="mb-3 text-xs font-semibold text-terra-400 uppercase tracking-wider">
                        Founding member: {formatPrice(plan.foundingPrice)}
                        <span className="ml-2 text-olive-300 font-normal normal-case tracking-normal">(first 25 only)</span>
                    </div>
                )}
                {plan.tagline && (
                    <p className="text-olive-300 text-sm leading-relaxed mb-6 border-b border-peach-400/20 pb-6">
                        {plan.tagline}
                    </p>
                )}

                <ul className="text-olive-300 space-y-4 text-sm mt-2 flex-grow">
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

export function BentoPricing() {
    const router = useRouter();
    const { hasFreeClassLead } = useFreeClassLead();

    const handleSelect = (planId: string) => {
        if (planId === 'drop_in') {
            if (hasFreeClassLead === true) return;
            router.push('/free-class');
            return;
        }
        router.push(`/user/subscribe?plan=${planId}`);
    };

    const dropIn = PLAN_CATALOG.find((p) => p.id === 'drop_in')!;
    const kickstarter = PLAN_CATALOG.find((p) => p.id === 'kickstarter')!;
    const memberships = PLAN_CATALOG.filter((p) => p.category === 'membership');

    return (
        <div className="space-y-20">
            {/* SECTION 1: TRY IT */}
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl md:text-5xl font-black text-olive-600 tracking-tight uppercase font-display">
                        Start Here
                    </h2>
                    <p className="text-olive-400 max-w-2xl mx-auto">
                        New to Pilates or new to Sol? Start with a free drop-in or our 2-week Kickstarter.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PlanCard
                        plan={dropIn}
                        onSelect={handleSelect}
                        cta={hasFreeClassLead === true ? 'FREE CLASS BOOKED' : 'BOOK FREE CLASS'}
                        ctaDisabled={hasFreeClassLead === true}
                    />
                    <PlanCard plan={kickstarter} onSelect={handleSelect} cta="START KICKSTARTER" featured />
                </div>
            </div>

            {/* SECTION 2: MEMBERSHIPS */}
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-4xl font-black text-olive-600 tracking-tight uppercase font-display">
                        Memberships
                    </h2>
                    <p className="text-olive-400 max-w-2xl mx-auto">Show up consistently. That&apos;s where the change happens.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {memberships.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            onSelect={handleSelect}
                            cta="SUBSCRIBE"
                            featured={plan.recommended}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
