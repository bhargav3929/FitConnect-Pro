"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, CheckCircle2, Calendar, AlertTriangle, ExternalLink, XCircle, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlanSelector } from "@/components/user/PlanSelector"
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore"
import { callCreatePaymentOrder, callVerifyPayment, callCancelSubscription, callGetSubscriptionPortalLink, callGetPricing } from "@fitconnect/shared/firebase/firestore"
import { getPlanById, type PlanId } from "@fitconnect/shared/types/subscription"
import type { ClientUser } from "@fitconnect/shared/types/client"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { useIntroClassLead } from "@/lib/hooks/useIntroClassLead"
import { useRazorpay } from "@/lib/hooks/useRazorpay"

type Step = 'plan' | 'success'

function isActiveUnexpiredSubscription(subscription: ClientUser['subscription'] | undefined): boolean {
    if (!subscription || subscription.status !== 'active') return false;
    if (!subscription.endDate) return true;
    return new Date(subscription.endDate).getTime() > Date.now();
}

export default function SubscribePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectClassId = searchParams.get('redirect')
    const preselectedPlan = searchParams.get('plan')

    const firebaseUser = useClientAuthStore(state => state.firebaseUser)
    const clientUser = useClientAuthStore(state => state.clientUser)
    const refreshSubscription = useClientAuthStore(state => state.refreshSubscription)
    const { hasIntroClassLead } = useIntroClassLead()
    const { openCheckout } = useRazorpay()

    const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({})

    useEffect(() => {
        callGetPricing()
            .then(data => {
                const overrides: Record<string, number> = {}
                for (const p of data.plans) {
                    overrides[p.planId] = p.price
                }
                setPriceOverrides(overrides)
            })
            .catch(() => {/* use hardcoded fallback */})
    }, [])

    const [step, setStep] = useState<Step>('plan')
    const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(
        preselectedPlan as PlanId | null
    )
    const [isProcessing, setIsProcessing] = useState(false)
    const [resultData, setResultData] = useState<{
        planName: string
        credits: number | null
        endDate: string
    } | null>(null)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [isLoadingPortal, setIsLoadingPortal] = useState(false)

    const selectedPlan = selectedPlanId ? getPlanById(selectedPlanId) : null
    const hasActiveSubscription = isActiveUnexpiredSubscription(clientUser?.subscription)

    const handleContinueToCheckout = async () => {
        if (!selectedPlanId) return
        if (selectedPlanId === 'drop_in') {
            router.push('/intro-class')
            return
        }
        if (selectedPlan?.category === 'membership' && hasActiveSubscription) {
            toast.error('Active membership found', {
                description: 'Membership upgrades are not enabled yet. Please wait for your current plan to expire.',
            })
            return
        }
        setIsProcessing(true)
        try {
            const order = await callCreatePaymentOrder(selectedPlanId)

            await openCheckout({
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: 'Sol Pilates',
                description: selectedPlan?.name ?? 'Membership',
                prefill: {
                    email: firebaseUser?.email ?? undefined,
                    name: firebaseUser?.displayName ?? undefined,
                },
                theme: { color: '#FF6A3D' },
                modal: {
                    ondismiss: () => setIsProcessing(false),
                },
                handler: async (response) => {
                    try {
                        const result = await callVerifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            paymentId: order.paymentId,
                        })
                        setResultData({
                            planName: result.planName,
                            credits: result.credits,
                            endDate: result.endDate,
                        })
                        await refreshSubscription()
                        setStep('success')
                    } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : 'Payment verification failed'
                        toast.error('Payment error', { description: msg })
                        setIsProcessing(false)
                    }
                },
            })
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to open payment'
            toast.error('Error', { description: msg })
            setIsProcessing(false)
        }
    }

    const handleCancelSubscription = async () => {
        setIsCancelling(true)
        try {
            await callCancelSubscription()
            await refreshSubscription()
            setShowCancelConfirm(false)
            toast.success('Subscription cancelled', {
                description: 'Your plan will remain active until the current period ends.',
            })
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to cancel subscription'
            toast.error('Error', { description: msg })
        } finally {
            setIsCancelling(false)
        }
    }

    const handleManagePayment = async () => {
        setIsLoadingPortal(true)
        try {
            const { url } = await callGetSubscriptionPortalLink()
            window.open(url, '_blank', 'noopener,noreferrer')
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Could not open payment portal'
            toast.error('Error', { description: msg })
        } finally {
            setIsLoadingPortal(false)
        }
    }

    return (
        <div className="pb-24 min-h-screen max-w-lg mx-auto">
            {/* Header */}
            <div className="mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {step !== 'success' && (
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-olive-400 hover:text-olive-600 text-sm font-medium mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}

                    <h1 className="app-page-title">
                        {step === 'plan' ? 'Choose Your Plan' : 'Welcome Aboard'}
                    </h1>
                </motion.div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {step === 'plan' && (
                    <motion.div
                        key="plan"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* ── Active subscription management ── */}
                        {hasActiveSubscription && clientUser?.subscription.planId && (
                            <div className="rounded-2xl border border-peach-400/20 bg-peach-50 p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-terra-400/10 flex items-center justify-center shrink-0">
                                        <CreditCard className="w-4 h-4 text-terra-400" />
                                    </div>
                                    <div>
                                        <p className="text-olive-600 font-bold text-sm leading-none">
                                            {clientUser.subscription.planId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </p>
                                        <p className="text-olive-300 text-xs mt-0.5">Active membership</p>
                                    </div>
                                    <span className="ml-auto px-2.5 py-1 rounded-full bg-green-500/10 text-green-700 text-[10px] font-black uppercase tracking-wider ring-1 ring-green-500/20">
                                        Active
                                    </span>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    {/* Manage payment — only for Razorpay subscriptions */}
                                    {clientUser.subscription.razorpaySubscriptionId && (
                                        <Button
                                            variant="outline"
                                            onClick={handleManagePayment}
                                            disabled={isLoadingPortal}
                                            className="flex-1 h-10 border-peach-400/30 text-olive-500 hover:bg-peach-200/50 font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            {isLoadingPortal ? 'OPENING...' : 'MANAGE PAYMENT'}
                                        </Button>
                                    )}

                                    {/* Cancel plan */}
                                    <button
                                        onClick={() => setShowCancelConfirm(true)}
                                        className="flex-1 h-10 rounded-xl border-2 border-terra-400 bg-terra-400/10 text-terra-400 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-terra-400/20 transition-colors"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        CANCEL PLAN
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Cancel confirmation modal ── */}
                        <AnimatePresence>
                            {showCancelConfirm && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    className="rounded-2xl border border-terra-400/30 bg-terra-400/5 p-5 space-y-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-terra-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-olive-600 font-bold text-sm">Cancel your plan?</p>
                                            <p className="text-olive-400 text-xs mt-1 leading-relaxed">
                                                Your membership will stay active until the current period ends. You won&apos;t be charged again.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowCancelConfirm(false)}
                                            disabled={isCancelling}
                                            className="flex-1 h-10 border-peach-400/30 text-olive-400 font-bold text-xs rounded-xl"
                                        >
                                            KEEP PLAN
                                        </Button>
                                        <Button
                                            onClick={handleCancelSubscription}
                                            disabled={isCancelling}
                                            className="flex-1 h-10 bg-terra-400 hover:bg-terra-300 text-peach-50 font-bold text-xs rounded-xl disabled:opacity-50"
                                        >
                                            {isCancelling ? 'CANCELLING...' : 'YES, CANCEL'}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <PlanSelector
                            selectedPlanId={selectedPlanId}
                            onSelect={setSelectedPlanId}
                            priceOverrides={priceOverrides}
                        />

                        {/* Selected plan features */}
                        {selectedPlan && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-peach-200/30 rounded-2xl p-5 border border-peach-400/10"
                            >
                                <p className="app-label mb-3">What you get</p>
                                <ul className="space-y-2">
                                    {selectedPlan.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-olive-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-terra-400 mt-0.5 shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}

                        <Button
                            onClick={handleContinueToCheckout}
                            disabled={
                                !selectedPlanId ||
                                isProcessing ||
                                (selectedPlan?.category === 'membership' && hasActiveSubscription) ||
                                (selectedPlanId === 'drop_in' && hasIntroClassLead === true)
                            }
                            className="w-full h-14 bg-terra-400 text-peach-50 hover:bg-terra-300 font-black tracking-wide text-base rounded-xl transition-all hover:shadow-lg hover:shadow-terra-400/20 disabled:opacity-50"
                        >
                            {isProcessing
                                ? 'OPENING PAYMENT...'
                                : selectedPlanId === 'drop_in'
                                    ? (hasIntroClassLead === true ? 'INTRO CLASS BOOKED' : 'BOOK INTRO CLASS')
                                    : selectedPlan?.category === 'membership' && hasActiveSubscription
                                        ? 'ACTIVE MEMBERSHIP'
                                    : 'CONTINUE TO PAYMENT'}
                        </Button>
                    </motion.div>
                )}

                {step === 'success' && resultData && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center pt-8"
                    >
                        {/* Animated checkmark */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            className="w-24 h-24 rounded-full bg-terra-400/10 flex items-center justify-center mb-6 ring-4 ring-terra-400/5"
                        >
                            <CheckCircle2 className="w-12 h-12 text-terra-400" />
                        </motion.div>

                        <h2 className="app-hero-title mb-2">
                            You&apos;re All Set!
                        </h2>
                        <p className="app-body mb-8 max-w-xs">
                            Your <span className="text-terra-400 font-bold">{resultData.planName}</span> plan is now active.
                            {resultData.credits !== null
                                ? ` You have ${resultData.credits} credits to use.`
                                : ' Enjoy unlimited classes!'}
                        </p>

                        {/* Plan summary card */}
                        <div className="bg-peach-200/30 rounded-2xl p-5 w-full max-w-sm mb-8 border border-peach-400/10">
                            <div className="flex justify-between mb-3 pb-3 border-b border-peach-400/10">
                                <span className="text-olive-300 text-sm">Plan</span>
                                <span className="text-olive-600 font-bold">{resultData.planName}</span>
                            </div>
                            <div className="flex justify-between mb-3 pb-3 border-b border-peach-400/10">
                                <span className="text-olive-300 text-sm">Credits</span>
                                <span className="text-olive-600 font-bold">
                                    {resultData.credits === null ? 'Unlimited' : resultData.credits}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-olive-300 text-sm">Valid Until</span>
                                <span className="text-olive-600 font-bold">
                                    {new Date(resultData.endDate).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="w-full max-w-sm space-y-3">
                            <Link href="/user/schedule" className="block">
                                <Button className="w-full h-14 bg-terra-400 text-peach-50 hover:bg-terra-300 font-black tracking-wide rounded-xl flex items-center justify-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    {redirectClassId ? 'BOOK A CLASS' : 'BOOK A CLASS'}
                                </Button>
                            </Link>
                            <Link href="/user/dashboard" className="block">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-peach-400/20 text-olive-400 hover:bg-peach-200/50 font-bold tracking-wide rounded-xl"
                                >
                                    GO TO DASHBOARD
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
