'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import PlanCard from '@/components/subscription/PlanCard';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { toast } from 'sonner';
import { SignupModal } from '@/components/auth/SignupModal';

export default function SubscriptionPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [showSignup, setShowSignup] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSelectPlan = async (planId: string) => {
        setSelectedPlan(planId);

        if (!user) {
            // setShowSignup(true);
            toast.info("Please sign up to continue (Signup Modal coming next step)");
        } else {
            await activatePlan(planId);
        }
    };

    const activatePlan = async (planId: string) => {
        try {
            setLoading(true);
            // Simulate API call to Cloud Function
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast.success('Subscription activated! Start booking classes now 🎉');
            router.push('/gyms'); // Will redirect to gyms browser
        } catch (error) {
            toast.error('Failed to activate subscription. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        Choose Your Level
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground">
                        Unlock unlimited access to the world's best trainers and cutting-edge facilities.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {SUBSCRIPTION_PLANS.map((plan, index) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            onSelect={() => handleSelectPlan(plan.id)}
                            loading={loading && selectedPlan === plan.id}
                        />
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-sm text-muted-foreground">
                        No credit card required for the pilot phase. Cancel anytime.
                    </p>
                </div>
            </div>

            {showSignup && (
                <SignupModal
                    onClose={() => setShowSignup(false)}
                    onSuccess={() => selectedPlan && activatePlan(selectedPlan)}
                />
            )}
        </div>
    );
}
