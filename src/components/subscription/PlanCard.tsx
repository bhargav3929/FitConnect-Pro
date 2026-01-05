'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SubscriptionPlan } from '@/types/subscription';
import { cn } from '@/lib/utils';

interface PlanCardProps {
    plan: SubscriptionPlan;
    onSelect: (planId: string) => void;
    loading?: boolean;
}

export default function PlanCard({ plan, onSelect, loading }: PlanCardProps) {
    const isRecommended = plan.recommended;

    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative"
        >
            {isRecommended && (
                <div className="absolute -top-4 inset-x-0 flex justify-center z-10">
                    <span className="bg-gradient-to-r from-secondary to-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Star className="h-3 w-3 fill-white" />
                        MOST POPULAR
                    </span>
                </div>
            )}

            <Card className={cn(
                "h-full flex flex-col border-2 transition-all duration-300",
                isRecommended
                    ? "border-secondary/50 shadow-xl bg-gradient-to-b from-white to-secondary/5 dark:from-background dark:to-secondary/10"
                    : "border-border hover:border-primary/30 hover:shadow-lg"
            )}>
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground mt-2">
                        The perfect start
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col items-center">
                    <div className="text-4xl font-bold my-6">
                        ${plan.price}
                        <span className="text-lg font-normal text-muted-foreground">/period</span>
                    </div>

                    <ul className="space-y-3 w-full max-w-[240px] text-left">
                        {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <div className={cn(
                                    "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                    isRecommended ? "bg-secondary/20 text-secondary" : "bg-primary/10 text-primary"
                                )}>
                                    <Check className="h-3 w-3" />
                                </div>
                                <span className="text-sm text-foreground/80">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>

                <CardFooter className="pt-6 pb-8">
                    <Button
                        className={cn(
                            "w-full h-12 text-base font-semibold shadow-md transition-all",
                            isRecommended ? "bg-secondary hover:bg-secondary/90 shadow-secondary/20" : ""
                        )}
                        onClick={() => onSelect(plan.id)}
                        disabled={loading}
                        variant={isRecommended ? "default" : "outline"}
                    >
                        {loading ? "Processing..." : (
                            <>
                                Select {plan.name}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
