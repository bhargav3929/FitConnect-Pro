"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, AlertTriangle, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClientUser } from "@fitconnect/shared/types/client"
import Link from "next/link"

interface SubscriptionWidgetProps {
    subscription: ClientUser['subscription']
}

export function SubscriptionWidget({ subscription }: SubscriptionWidgetProps) {
    const { planId, status, classesRemaining, introCreditRemaining, endDate, cancelAtPeriodEnd } = subscription
    const [nowMs] = useState(() => Date.now())

    // No plan / expired / cancelled state
    if (!planId || status === 'expired' || status === 'canceled') {
        const isExpired = planId && status === 'expired'

        return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                {isExpired ? (
                    <div className="relative overflow-hidden rounded-2xl border border-terra-400/20 bg-terra-400/5 p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-terra-400/15 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-terra-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-olive-600 font-bold text-sm">Plan Expired</h3>
                                <p className="text-olive-300 text-xs mt-1">
                                    Your {planId.replace(/_/g, ' ')} plan has expired. Renew to continue booking classes.
                                </p>
                            </div>
                            <Link href="/user/subscribe">
                                <Button className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold px-5 h-9 text-xs rounded-lg whitespace-nowrap">
                                    RENEW PLAN
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <Link href="/user/subscribe" className="block group">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-terra-400 to-terra-300 p-6">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-peach-200/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                            <div className="relative z-10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-peach-50/15 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-peach-50" />
                                    </div>
                                    <div>
                                        <h3 className="text-peach-50 font-bold text-sm">Choose a Plan</h3>
                                        <p className="text-peach-50/70 text-xs mt-0.5">Start booking classes today</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-peach-50/15 flex items-center justify-center group-hover:bg-peach-50/25 transition-colors">
                                    <ArrowRight className="w-4 h-4 text-peach-50 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>
                )}
            </motion.div>
        )
    }

    // Active plan
    const isIntroPlan = planId === 'drop_in'
    const isUnlimited = !isIntroPlan && classesRemaining === null
    const planLabel = planId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    const endDateObj = (() => {
        if (!endDate) return null
        if (endDate instanceof Date && !isNaN(endDate.getTime())) return endDate
        const raw = endDate as unknown
        if (raw && typeof raw === 'object' && 'seconds' in (raw as Record<string, unknown>)) {
            return new Date((raw as { seconds: number }).seconds * 1000)
        }
        const d = new Date(raw as string | number)
        return isNaN(d.getTime()) ? null : d
    })()

    const daysLeft = endDateObj ? Math.max(0, Math.ceil((endDateObj.getTime() - nowMs) / (1000 * 60 * 60 * 24))) : 0
    const renewalDate = endDateObj ? endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
    const renewalCanceled = cancelAtPeriodEnd === true

    const displayedCredits = isIntroPlan ? introCreditRemaining : classesRemaining
    const credits = displayedCredits ?? 0
    const maxCredits = isUnlimited ? 1 : Math.max(credits, 1)
    const creditFraction = isUnlimited ? 1 : credits / maxCredits
    const circumference = 2 * Math.PI * 22
    const offset = circumference * (1 - Math.min(Math.max(creditFraction, 0), 1))

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-peach-400/15 bg-peach-50 p-5"
        >
            {/* Plan info row */}
            <div className="flex items-center gap-4">
                {/* Credits ring */}
                <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="3" className="text-peach-300/30" />
                        <circle
                            cx="24" cy="24" r="22" fill="none"
                            stroke="currentColor" strokeWidth="3"
                            strokeLinecap="round"
                            className="text-terra-400"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-olive-600 leading-none">
                            {isUnlimited ? '∞' : displayedCredits ?? 0}
                        </span>
                    </div>
                </div>

                {/* Plan info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 rounded bg-terra-400/10 text-terra-400 text-[10px] font-black uppercase tracking-wider">
                            {planLabel}
                        </span>
                        <span className={`text-[10px] font-medium ${renewalCanceled ? 'text-yellow-700' : 'text-olive-300'}`}>
                            {renewalCanceled ? 'Renewal canceled' : 'Active'}
                        </span>
                    </div>
                    <p className="text-olive-300 text-xs">
                        {isUnlimited
                            ? 'Unlimited classes'
                            : `${displayedCredits} ${isIntroPlan ? 'intro ' : ''}credit${(displayedCredits ?? 0) !== 1 ? 's' : ''} left`}
                        {' · '}{renewalCanceled ? 'Active until' : 'Renews'} {renewalDate}
                    </p>
                </div>

                {/* Days left */}
                <div className="text-right shrink-0">
                    <p className="text-lg font-black text-olive-600 leading-none">{daysLeft}</p>
                    <p className="text-[10px] text-olive-300 font-medium mt-0.5">days left</p>
                </div>
            </div>

        </motion.div>
    )
}
