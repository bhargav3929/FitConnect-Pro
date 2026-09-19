"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { PauseCircle, PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { callEndFreeze, callFreezePlan } from "@fitconnect/shared/firebase/firestore"
import type { ClientUser } from "@fitconnect/shared/types/client"
import { studioDayKey } from "@fitconnect/shared/schedule/studio-day"
import {
    FREEZE_INELIGIBLE_MESSAGES,
    FREEZE_MAX_DAYS,
    FREEZE_MAX_LEAD_DAYS,
    FREEZE_MIN_DAYS,
    addDays,
    getFreezeIneligibleReason,
    hasOpenFreeze,
    isFrozenAt,
    nextFreezeAvailableAt,
} from "@fitconnect/shared/subscriptions/policy"

function formatDay(date: Date | null | undefined): string {
    if (!date) return "--"
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
}

/** The freeze section of the member's plan card: schedule, show, or end a freeze. */
export function PlanFreezePanel({
    subscription,
    onChanged,
}: {
    subscription: ClientUser["subscription"]
    onChanged: () => Promise<unknown> | void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [startKey, setStartKey] = useState(() => studioDayKey(new Date()))
    const [days, setDays] = useState(FREEZE_MAX_DAYS)
    const [isSaving, setIsSaving] = useState(false)

    const now = new Date()
    const freezeState = { freezeStartDate: subscription.freezeStartDate, freezeEndDate: subscription.freezeEndDate }
    const openFreeze = hasOpenFreeze(freezeState, now)
    const frozenNow = isFrozenAt(freezeState, now)
    const reason = getFreezeIneligibleReason({
        status: subscription.status,
        planId: subscription.planId,
        endDate: subscription.endDate,
        ...freezeState,
        lastFreezeRequestedAt: subscription.lastFreezeRequestedAt,
    }, now)

    if (reason === "no-active-plan" || reason === "demo-plan") return null

    const todayKey = studioDayKey(now)
    const maxStartKey = studioDayKey(addDays(now, FREEZE_MAX_LEAD_DAYS))
    const [y, mo, d] = startKey.split("-").map(Number)
    const previewEnd = subscription.endDate ? addDays(new Date(subscription.endDate), days) : null
    const resumeOn = new Date(Date.UTC(y, mo - 1, d + days))

    const handleFreeze = async () => {
        setIsSaving(true)
        try {
            const result = await callFreezePlan({ startDate: startKey, days })
            await onChanged()
            setIsOpen(false)
            toast.success("Plan frozen", {
                description: `Back on ${formatDay(new Date(result.freezeEndDate))}. Your plan now ends ${formatDay(new Date(result.endDate))}.`
                    + (result.canceledBookings ? ` ${result.canceledBookings} booked class${result.canceledBookings === 1 ? " was" : "es were"} cancelled and credited back.` : ""),
            })
        } catch (err) {
            toast.error("Could not freeze plan", { description: err instanceof Error ? err.message : undefined })
        } finally {
            setIsSaving(false)
        }
    }

    const handleEndFreeze = async () => {
        setIsSaving(true)
        try {
            const result = await callEndFreeze()
            await onChanged()
            toast.success(frozenNow ? "Welcome back" : "Freeze withdrawn", {
                description: `Your plan now ends ${formatDay(new Date(result.endDate))}.`,
            })
        } catch (err) {
            toast.error("Could not end freeze", { description: err instanceof Error ? err.message : undefined })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="pt-3 border-t border-peach-400/10 space-y-3">
            {openFreeze ? (
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-olive-600 font-bold text-xs">
                            {frozenNow ? "Plan frozen" : "Freeze scheduled"}
                        </p>
                        <p className="text-olive-400 text-xs mt-0.5">
                            {formatDay(subscription.freezeStartDate)} to {formatDay(subscription.freezeEndDate)}. No bookings in this window.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleEndFreeze}
                        disabled={isSaving}
                        className="shrink-0 h-9 border-peach-400/30 text-olive-500 font-bold text-xs rounded-lg gap-1.5"
                    >
                        <PlayCircle className="w-3.5 h-3.5" />
                        {isSaving ? "ENDING..." : frozenNow ? "END FREEZE" : "WITHDRAW"}
                    </Button>
                </div>
            ) : reason === "cooldown" ? (
                <p className="text-olive-300 text-xs">
                    {FREEZE_INELIGIBLE_MESSAGES.cooldown} Next freeze available {formatDay(nextFreezeAvailableAt(subscription.lastFreezeRequestedAt, now))}.
                </p>
            ) : (
                <button
                    onClick={() => setIsOpen((open) => !open)}
                    className="w-full h-10 rounded-xl border border-peach-400/25 text-olive-500 font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:bg-peach-100 transition-colors"
                >
                    <PauseCircle className="w-3.5 h-3.5" />
                    FREEZE MY PLAN
                </button>
            )}

            <AnimatePresence>
                {isOpen && !openFreeze && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden rounded-xl border border-peach-400/20 bg-peach-100/60 px-4 py-3 space-y-3"
                    >
                        <p className="text-olive-400 text-xs leading-relaxed">
                            Pause for {FREEZE_MIN_DAYS} to {FREEZE_MAX_DAYS} days, once every 12 months. Your plan&apos;s end date moves out
                            by the same number of days. Classes you have booked in that window are cancelled and credited back.{" "}
                            <Link href="/policies#membership-freeze" className="text-terra-400 font-bold">Freeze policy</Link>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="app-stat-label mb-1 block">Starts</span>
                                <input
                                    type="date"
                                    value={startKey}
                                    min={todayKey}
                                    max={maxStartKey}
                                    onChange={(e) => setStartKey(e.target.value || todayKey)}
                                    className="w-full bg-peach-50 border border-peach-400/20 rounded-lg px-3 h-10 text-olive-600 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400/30"
                                />
                            </label>
                            <label className="block">
                                <span className="app-stat-label mb-1 block">Days</span>
                                <select
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="w-full bg-peach-50 border border-peach-400/20 rounded-lg px-3 h-10 text-olive-600 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400/30"
                                >
                                    {Array.from({ length: FREEZE_MAX_DAYS - FREEZE_MIN_DAYS + 1 }, (_, i) => FREEZE_MIN_DAYS + i).map((n) => (
                                        <option key={n} value={n}>{n} days</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <p className="text-olive-500 text-xs">
                            Back on <span className="font-bold">{formatDay(resumeOn)}</span>. Plan ends{" "}
                            <span className="font-bold">{formatDay(previewEnd)}</span>
                            {subscription.razorpaySubscriptionId && subscription.autoRenew ? ". Billing continues on its usual dates." : "."}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isSaving}
                                className="flex-1 h-8 border-peach-400/30 text-olive-400 font-bold text-xs rounded-lg"
                            >
                                NOT NOW
                            </Button>
                            <Button
                                onClick={handleFreeze}
                                disabled={isSaving}
                                className="flex-1 h-8 bg-terra-400 hover:bg-terra-300 text-peach-50 font-bold text-xs rounded-lg disabled:opacity-50"
                            >
                                {isSaving ? "FREEZING..." : `FREEZE ${days} DAYS`}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
