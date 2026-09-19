"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    callAdminUpdateMemberSubscription,
    callEndFreeze,
    callFreezePlan,
    type AdminSubscriptionEdit,
} from "@fitconnect/shared/firebase/firestore"
import { PLAN_CATALOG, getPlanById } from "@fitconnect/shared/types/subscription"
import { studioDayKey } from "@fitconnect/shared/schedule/studio-day"
import {
    FREEZE_MAX_DAYS,
    FREEZE_MAX_LEAD_DAYS,
    FREEZE_MIN_DAYS,
    addDays,
    hasOpenFreeze,
} from "@fitconnect/shared/subscriptions/policy"
import type { UserProfile } from "@fitconnect/shared/types/user"

export type MemberPlanDialogMode = "edit" | "freeze"

const KEEP_PLAN = "__keep__"
const STATUS_OPTIONS = ["active", "expired", "canceled"] as const

const fieldClass = "w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all text-sm"
const secondaryButton = "flex-1 h-11 border border-peach-400/25 text-olive-500 text-xs font-bold tracking-[0.2em] uppercase hover:bg-peach-200/40 transition-colors disabled:opacity-50"
const primaryButton = "flex-1 h-11 bg-terra-400 text-peach-50 text-xs font-bold tracking-[0.2em] uppercase hover:bg-terra-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"

function toDate(value: unknown): Date | null {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value === "object" && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
        return (value as { toDate: () => Date }).toDate()
    }
    if (typeof value === "object" && "seconds" in value) return new Date((value as { seconds: number }).seconds * 1000)
    const d = new Date(value as string | number)
    return Number.isNaN(d.getTime()) ? null : d
}

function formatDay(date: Date | null): string {
    if (!date) return "--"
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Something went wrong"
}

export function MemberPlanDialog({
    member,
    mode,
    onClose,
    onSaved,
}: {
    member: UserProfile | null
    mode: MemberPlanDialogMode
    onClose: () => void
    onSaved: () => void
}) {
    const sub = member?.subscription
    const endDate = toDate(sub?.endDate)
    const freezeStart = toDate(sub?.freezeStartDate)
    const freezeEnd = toDate(sub?.freezeEndDate)
    const openFreeze = hasOpenFreeze({ freezeStartDate: freezeStart, freezeEndDate: freezeEnd })
    const hasLiveRazorpay = !!sub?.razorpaySubscriptionId && sub?.status === "active" && sub?.autoRenew === true

    // The parent remounts this dialog per member and mode (via key), so the
    // initial form can be taken straight from props.
    const [initial] = useState(() => ({
        planId: KEEP_PLAN,
        classesRemaining: sub?.classesRemaining === null ? "" : String(sub?.classesRemaining ?? 0),
        introCreditRemaining: String(sub?.introCreditRemaining ?? 0),
        guestPassesRemaining: String(sub?.guestPassesRemaining ?? 0),
        endDate: endDate ? studioDayKey(endDate) : "",
        status: (sub?.status ?? "expired") as string,
        reason: "",
    }))

    const [form, setForm] = useState(initial)
    const [freezeStartKey, setFreezeStartKey] = useState(() => studioDayKey(new Date()))
    const [freezeDays, setFreezeDays] = useState(String(FREEZE_MAX_DAYS))
    const [isSaving, setIsSaving] = useState(false)

    // Picking a new plan pre-fills its credits and validity so the admin sees what will be granted.
    const selectPlan = (planId: string) => {
        const plan = planId === KEEP_PLAN ? null : getPlanById(planId)
        setForm((prev) => plan
            ? {
                ...prev,
                planId,
                classesRemaining: plan.credits === null ? "" : String(plan.id === "drop_in" ? 0 : plan.credits),
                guestPassesRemaining: String(plan.guestPasses),
                endDate: studioDayKey(addDays(new Date(), plan.durationDays)),
                status: "active",
            }
            : { ...initial, reason: prev.reason })
    }

    const handleSaveEdit = async () => {
        if (!member) return
        const edit: AdminSubscriptionEdit = { userId: member.uid, reason: form.reason.trim() }
        const newPlan = form.planId !== KEEP_PLAN ? getPlanById(form.planId) : null
        if (newPlan) edit.planId = newPlan.id

        const parseCount = (value: string, label: string): number | undefined => {
            const n = Number(value)
            if (value.trim() === "" || !Number.isInteger(n) || n < 0) throw new Error(`${label} must be a whole number`)
            return n
        }
        try {
            const unlimited = newPlan ? newPlan.credits === null : sub?.classesRemaining === null
            if (!unlimited && (newPlan || form.classesRemaining !== initial.classesRemaining)) {
                edit.classesRemaining = parseCount(form.classesRemaining, "Class credits")
            }
            if (form.introCreditRemaining !== initial.introCreditRemaining) {
                edit.introCreditRemaining = parseCount(form.introCreditRemaining, "Demo credits")
            }
            if (newPlan || form.guestPassesRemaining !== initial.guestPassesRemaining) {
                edit.guestPassesRemaining = parseCount(form.guestPassesRemaining, "Guest passes")
            }
        } catch (error) {
            toast.error(errorMessage(error))
            return
        }
        if (form.endDate && (newPlan || form.endDate !== initial.endDate)) edit.endDate = form.endDate
        if (!newPlan && form.status !== initial.status) edit.status = form.status as AdminSubscriptionEdit["status"]

        if (edit.reason.length < 3) {
            toast.error("Add a short reason, it is saved in the member's history")
            return
        }
        if (Object.keys(edit).length <= 2) {
            toast.error("Nothing has changed")
            return
        }

        setIsSaving(true)
        try {
            await callAdminUpdateMemberSubscription(edit)
            toast.success(newPlan ? `${newPlan.name} assigned` : "Subscription updated")
            onSaved()
        } catch (error) {
            toast.error(errorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const handleFreeze = async () => {
        if (!member) return
        const days = Number(freezeDays)
        if (!Number.isInteger(days) || days < FREEZE_MIN_DAYS || days > FREEZE_MAX_DAYS) {
            toast.error(`A freeze is ${FREEZE_MIN_DAYS} to ${FREEZE_MAX_DAYS} days`)
            return
        }
        setIsSaving(true)
        try {
            const result = await callFreezePlan({ userId: member.uid, startDate: freezeStartKey, days })
            toast.success(`Frozen until ${formatDay(new Date(result.freezeEndDate))}`
                + (result.canceledBookings ? `, ${result.canceledBookings} booking(s) cancelled and credited back` : ""))
            onSaved()
        } catch (error) {
            toast.error(errorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const handleEndFreeze = async () => {
        if (!member) return
        setIsSaving(true)
        try {
            const result = await callEndFreeze({ userId: member.uid })
            toast.success(`Freeze ended. Plan now ends ${formatDay(new Date(result.endDate))}`)
            onSaved()
        } catch (error) {
            toast.error(errorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    const todayKey = studioDayKey(new Date())
    const maxFreezeStartKey = studioDayKey(addDays(new Date(), FREEZE_MAX_LEAD_DAYS))
    const selectedPlan = form.planId !== KEEP_PLAN ? getPlanById(form.planId) : null
    const creditsUnlimited = selectedPlan ? selectedPlan.credits === null : sub?.classesRemaining === null

    return (
        <Dialog open={member !== null} onOpenChange={(open) => !open && !isSaving && onClose()}>
            <DialogContent className="bg-peach-50 border-peach-400/20 max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="app-section-title">
                        {mode === "edit" ? "Edit Plan & Credits" : "Freeze Plan"}
                    </DialogTitle>
                    <DialogDescription className="text-olive-300 text-sm">
                        {member?.name || member?.email}
                        {mode === "edit"
                            ? ". Changes apply immediately and are recorded in the member's history."
                            : `. Moves the plan's end date out by the frozen days. Bookings inside the window are cancelled and credited back.`}
                    </DialogDescription>
                </DialogHeader>

                {mode === "edit" ? (
                    <div className="space-y-5 mt-2">
                        <div>
                            <label className="block app-label mb-2">Plan</label>
                            <select
                                value={form.planId}
                                onChange={(e) => selectPlan(e.target.value)}
                                className={`${fieldClass} appearance-none cursor-pointer`}
                            >
                                <option value={KEEP_PLAN}>
                                    Keep current ({sub?.planId ? getPlanById(sub.planId)?.name ?? sub.planId : "no plan"})
                                </option>
                                {PLAN_CATALOG.map((plan) => (
                                    <option key={plan.id} value={plan.id} disabled={hasLiveRazorpay}>
                                        Assign {plan.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] text-olive-300 mt-1.5">
                                {hasLiveRazorpay
                                    ? "This member pays through an auto-renewing Razorpay membership, so the plan itself can only change from their account. Credits and end date can still be adjusted."
                                    : "Assigning a plan grants it fresh with no payment taken, for cash payments or comps. It does not auto-renew."}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block app-label mb-2">Class Credits</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={creditsUnlimited ? "" : form.classesRemaining}
                                    placeholder={creditsUnlimited ? "Unlimited" : ""}
                                    disabled={creditsUnlimited}
                                    onChange={(e) => setForm((prev) => ({ ...prev, classesRemaining: e.target.value }))}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className="block app-label mb-2">Demo Credits</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.introCreditRemaining}
                                    onChange={(e) => setForm((prev) => ({ ...prev, introCreditRemaining: e.target.value }))}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className="block app-label mb-2">Guest Passes</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.guestPassesRemaining}
                                    onChange={(e) => setForm((prev) => ({ ...prev, guestPassesRemaining: e.target.value }))}
                                    className={fieldClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block app-label mb-2">Last Day Of Access</label>
                                <input
                                    type="date"
                                    value={form.endDate}
                                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className="block app-label mb-2">Status</label>
                                <select
                                    value={selectedPlan ? "active" : form.status}
                                    disabled={!!selectedPlan}
                                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                                    className={`${fieldClass} appearance-none cursor-pointer capitalize disabled:opacity-60`}
                                >
                                    {STATUS_OPTIONS.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block app-label mb-2">Reason</label>
                            <input
                                type="text"
                                value={form.reason}
                                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                                placeholder="e.g. Paid cash at the studio, goodwill credit"
                                className={fieldClass}
                            />
                            <p className="text-[11px] text-olive-300 mt-1.5">Saved in the member&apos;s subscription history.</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} disabled={isSaving} className={secondaryButton}>Cancel</button>
                            <button onClick={handleSaveEdit} disabled={isSaving} className={primaryButton}>
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSaving ? "Saving" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                ) : openFreeze ? (
                    <div className="space-y-5 mt-2">
                        <div className="bg-peach-100/60 border border-peach-400/15 p-4 grid grid-cols-2 gap-3">
                            <div>
                                <p className="app-stat-label mb-0.5">Frozen From</p>
                                <p className="text-sm text-olive-600 font-semibold">{formatDay(freezeStart)}</p>
                            </div>
                            <div>
                                <p className="app-stat-label mb-0.5">Resumes</p>
                                <p className="text-sm text-olive-600 font-semibold">{formatDay(freezeEnd)}</p>
                            </div>
                        </div>
                        <p className="text-sm text-olive-400">
                            Ending the freeze now hands the unused days back, so the plan&apos;s end date moves earlier by the same amount.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} disabled={isSaving} className={secondaryButton}>Close</button>
                            <button onClick={handleEndFreeze} disabled={isSaving} className={primaryButton}>
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSaving ? "Ending" : "End Freeze Now"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block app-label mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={freezeStartKey}
                                    min={todayKey}
                                    max={maxFreezeStartKey}
                                    onChange={(e) => setFreezeStartKey(e.target.value)}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className="block app-label mb-2">Days ({FREEZE_MIN_DAYS} to {FREEZE_MAX_DAYS})</label>
                                <input
                                    type="number"
                                    min={FREEZE_MIN_DAYS}
                                    max={FREEZE_MAX_DAYS}
                                    value={freezeDays}
                                    onChange={(e) => setFreezeDays(e.target.value)}
                                    className={fieldClass}
                                />
                            </div>
                        </div>
                        <p className="text-sm text-olive-400">
                            Current end date {formatDay(endDate)}. Members can freeze once every 12 months from their profile;
                            as an admin you can freeze outside that limit.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} disabled={isSaving} className={secondaryButton}>Cancel</button>
                            <button onClick={handleFreeze} disabled={isSaving} className={primaryButton}>
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSaving ? "Freezing" : "Freeze Plan"}
                            </button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
