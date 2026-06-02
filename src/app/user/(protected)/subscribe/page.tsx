"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, CheckCircle2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlanSelector } from "@/components/user/PlanSelector"
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore"
import { callCreatePaymentOrder, callVerifyPayment } from "@fitconnect/shared/firebase/firestore"
import { getPlanById, type PlanId } from "@fitconnect/shared/types/subscription"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { useFreeClassLead } from "@/lib/hooks/useFreeClassLead"
import { useRazorpay } from "@/lib/hooks/useRazorpay"

type Step = 'plan' | 'success'

export default function SubscribePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectClassId = searchParams.get('redirect')
    const preselectedPlan = searchParams.get('plan')

    const firebaseUser = useClientAuthStore(state => state.firebaseUser)
    const refreshSubscription = useClientAuthStore(state => state.refreshSubscription)
    const { hasFreeClassLead } = useFreeClassLead()
    const { openCheckout } = useRazorpay()

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

    const selectedPlan = selectedPlanId ? getPlanById(selectedPlanId) : null

    const handleContinueToCheckout = async () => {
        if (!selectedPlanId) return
        if (selectedPlanId === 'drop_in') {
            router.push('/free-class')
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

                    <h1 className="text-3xl md:text-4xl font-black text-olive-600 tracking-normal font-display">
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
                        <PlanSelector
                            selectedPlanId={selectedPlanId}
                            onSelect={setSelectedPlanId}
                        />

                        {/* Selected plan features */}
                        {selectedPlan && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-peach-200/30 rounded-2xl p-5 border border-peach-400/10"
                            >
                                <p className="text-xs font-bold text-olive-400 uppercase tracking-wider mb-3">What you get</p>
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
                                (selectedPlanId === 'drop_in' && hasFreeClassLead === true)
                            }
                            className="w-full h-14 bg-terra-400 text-peach-50 hover:bg-terra-300 font-black tracking-wide text-base rounded-xl transition-all hover:shadow-lg hover:shadow-terra-400/20 disabled:opacity-50"
                        >
                            {isProcessing
                                ? 'OPENING PAYMENT...'
                                : selectedPlanId === 'drop_in'
                                    ? (hasFreeClassLead === true ? 'INTRO CLASS BOOKED' : 'BOOK INTRO CLASS')
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

                        <h2 className="text-3xl font-black text-olive-600 mb-2 font-display tracking-normal">
                            You&apos;re All Set!
                        </h2>
                        <p className="text-olive-300 text-sm mb-8 max-w-xs">
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
