"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, History, Receipt, AlertTriangle } from "lucide-react"
import type { SubscriptionEvent, SubscriptionEventAction } from "@fitconnect/shared/types/subscriptionEvent"
import type { MemberPaymentSummary } from "@fitconnect/shared/firebase/firestore"

/**
 * Chronological ledger of a member's subscription: every grant, credit move,
 * expiry, rejection and audit finding, with the payment it relates to.
 * Answers "why does this member have this plan" from Firestore alone.
 */

interface Props {
    events: SubscriptionEvent[]
    payments: MemberPaymentSummary[]
    isLoading: boolean
}

const ACTION_LABEL: Record<SubscriptionEventAction, string> = {
    'plan-granted': 'Plan granted',
    'plan-renewed': 'Plan renewed',
    'plan-changed': 'Plan changed',
    'plan-change-scheduled': 'Change scheduled',
    'plan-synced': 'Synced with Razorpay',
    'plan-canceled': 'Renewal canceled',
    'plan-expired': 'Plan expired',
    'plan-halted': 'Plan halted',
    'credit-consumed': 'Credit used',
    'credit-restored': 'Credit restored',
    'profile-created': 'Profile created',
    'profile-repaired': 'Profile repaired',
    'grant-rejected': 'Grant rejected',
    'audit-mismatch': 'Audit mismatch',
}

const ACTION_TONE: Record<SubscriptionEventAction, string> = {
    'plan-granted': 'bg-green-500/10 text-green-700 ring-1 ring-green-500/20',
    'plan-renewed': 'bg-green-500/10 text-green-700 ring-1 ring-green-500/20',
    'plan-changed': 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20',
    'plan-change-scheduled': 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20',
    'plan-synced': 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20',
    'plan-canceled': 'bg-peach-300/40 text-olive-500 ring-1 ring-olive-400/15',
    'plan-expired': 'bg-peach-300/40 text-olive-500 ring-1 ring-olive-400/15',
    'plan-halted': 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20',
    'credit-consumed': 'bg-peach-300/30 text-olive-400',
    'credit-restored': 'bg-peach-300/30 text-olive-400',
    'profile-created': 'bg-peach-300/30 text-olive-400',
    'profile-repaired': 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20',
    'grant-rejected': 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20',
    'audit-mismatch': 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20',
}

const SOURCE_LABEL: Record<SubscriptionEvent['source'], string> = {
    'checkout-callback': 'app checkout',
    webhook: 'Razorpay webhook',
    admin: 'admin',
    member: 'member',
    scheduled: 'scheduled job',
    'auth-trigger': 'sign-up trigger',
    audit: 'daily audit',
}

function formatDateTime(value: unknown): string {
    if (!value) return '--'
    const d = new Date(value as string)
    if (Number.isNaN(d.getTime())) return '--'
    return d.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
    })
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'none'
    if (typeof value === 'string') {
        const d = new Date(value)
        if (/^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(d.getTime())) return formatDateTime(value)
        return value
    }
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

const KEY_FIELDS = ['planId', 'status', 'classesRemaining', 'introCreditRemaining', 'guestPassesRemaining', 'endDate'] as const

function formatMoney(p: MemberPaymentSummary): string {
    if (typeof p.totalPaise === 'number') return `₹${(p.totalPaise / 100).toLocaleString('en-IN')}`
    if (typeof p.amount === 'number') return `${p.currency === 'usd' ? '$' : '₹'}${p.amount.toLocaleString('en-IN')}`
    return '--'
}

function EventRow({ event }: { event: SubscriptionEvent }) {
    const [open, setOpen] = useState(false)
    const changedKeys = Object.keys(event.changes ?? {})
    const summary = KEY_FIELDS
        .filter((k) => changedKeys.includes(k))
        .map((k) => {
            const before = event.before?.[k]
            const after = event.changes[k]
            const isDelta = typeof after === 'number' && (event.action === 'credit-consumed' || event.action === 'credit-restored')
            return `${k}: ${isDelta ? (after > 0 ? `+${after}` : String(after)) : `${formatValue(before)} → ${formatValue(after)}`}`
        })

    return (
        <div className="border-b border-peach-400/10 last:border-b-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full text-left py-2.5 flex items-start gap-2"
            >
                {open ? <ChevronDown className="w-3.5 h-3.5 mt-1 text-olive-300 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 mt-1 text-olive-300 shrink-0" />}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 app-badge-text rounded-sm ${ACTION_TONE[event.action] ?? ''}`}>
                            {ACTION_LABEL[event.action] ?? event.action}
                        </span>
                        <span className="text-[11px] text-olive-300">{formatDateTime(event.createdAt)}</span>
                        <span className="text-[11px] text-olive-300">· {SOURCE_LABEL[event.source] ?? event.source}</span>
                    </div>
                    <p className="text-sm text-olive-600 mt-1 break-words">{event.reason}</p>
                    {summary.length > 0 && (
                        <p className="text-[11px] text-olive-400 mt-0.5 break-words">{summary.join(' · ')}</p>
                    )}
                </div>
            </button>
            {open && (
                <div className="pb-3 pl-5 text-[11px] text-olive-400 space-y-1 break-words [overflow-wrap:anywhere]">
                    {event.paymentId && <p>payment: {event.paymentId}</p>}
                    {event.razorpayPaymentId && <p>razorpay payment: {event.razorpayPaymentId}</p>}
                    {event.razorpayOrderId && <p>razorpay order: {event.razorpayOrderId}</p>}
                    {event.razorpaySubscriptionId && <p>razorpay subscription: {event.razorpaySubscriptionId}</p>}
                    {event.webhookEventId && <p>webhook event: {event.webhookEventId}</p>}
                    {event.bookingId && <p>booking: {event.bookingId}</p>}
                    {event.actorId && <p>actor: {event.actorId}</p>}
                    {changedKeys.length > 0 && (
                        <div className="pt-1">
                            <p className="app-stat-label mb-0.5">All changes</p>
                            {changedKeys.map((k) => (
                                <p key={k}>{k}: {formatValue(event.before?.[k])} → {formatValue(event.changes[k])}</p>
                            ))}
                        </div>
                    )}
                    {Object.keys(event.metadata ?? {}).length > 0 && (
                        <p className="pt-1">context: {JSON.stringify(event.metadata)}</p>
                    )}
                </div>
            )}
        </div>
    )
}

export function SubscriptionTimeline({ events, payments, isLoading }: Props) {
    return (
        <div className="space-y-4">
            <div className="bg-peach-100/60 border border-peach-400/15 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Receipt className="w-3.5 h-3.5 text-terra-400" />
                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">Payments</p>
                    </div>
                    {!isLoading && payments.length > 0 && (
                        <span className="text-[10px] font-bold text-olive-400">{payments.length}</span>
                    )}
                </div>
                {isLoading ? (
                    <div className="h-10 bg-peach-200/50 animate-pulse" />
                ) : payments.length === 0 ? (
                    <p className="text-sm text-olive-300 italic">No payments</p>
                ) : (
                    <div>
                        {payments.map((p) => (
                            <div key={p.id} className="flex items-start justify-between gap-3 py-2 border-b border-peach-400/10 last:border-b-0">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-olive-600 truncate">
                                        {p.planName || p.planId || 'Unknown plan'} · {formatMoney(p)}
                                    </p>
                                    <p className="text-[11px] text-olive-300 mt-0.5 break-words [overflow-wrap:anywhere]">
                                        {p.paidAt ? `paid ${formatDateTime(p.paidAt)}` : `created ${formatDateTime(p.createdAt)}`}
                                        {p.grantedBy ? ` · granted by ${p.grantedBy}` : ''}
                                        {p.razorpayPaymentId ? ` · ${p.razorpayPaymentId}` : ''}
                                    </p>
                                    {p.needsReview && (
                                        <p className="text-[11px] text-red-600 mt-0.5 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> needs review: {p.reviewReason}
                                        </p>
                                    )}
                                </div>
                                <span className={`shrink-0 inline-flex px-2 py-0.5 app-badge-text rounded-sm ${
                                    p.status === 'succeeded' ? 'bg-green-500/10 text-green-700 ring-1 ring-green-500/20'
                                        : p.status === 'failed' ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20'
                                            : 'bg-peach-300/40 text-olive-500 ring-1 ring-olive-400/15'
                                }`}>
                                    {p.status ?? 'unknown'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-peach-100/60 border border-peach-400/15 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-terra-400" />
                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">Subscription History</p>
                    </div>
                    {!isLoading && events.length > 0 && (
                        <span className="text-[10px] font-bold text-olive-400">{events.length}</span>
                    )}
                </div>
                {isLoading ? (
                    <div className="space-y-2">
                        {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-peach-200/50 animate-pulse" />)}
                    </div>
                ) : events.length === 0 ? (
                    <p className="text-sm text-olive-300 italic">No history recorded yet. Changes made before the ledger was added are not shown.</p>
                ) : (
                    <div>
                        {events.map((e) => <EventRow key={e.id} event={e} />)}
                    </div>
                )}
            </div>
        </div>
    )
}
