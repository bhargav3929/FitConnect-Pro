"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { collection, doc, getDocs, orderBy, query, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@fitconnect/shared/firebase/config"
import {
    getEarliestBookingsPerUser,
    getClassesByIds,
} from "@fitconnect/shared/firebase/firestore"
import { Booking } from "@fitconnect/shared/types/booking"
import { ClassSession } from "@fitconnect/shared/types/class"
import { toast } from "sonner"
import { Mail, Phone, Calendar, CalendarCheck, CalendarX } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"

type LeadStatus = "new" | "contacted" | "converted" | "archived"

type Lead = {
    id: string
    name: string
    email: string
    phone: string
    goals?: string
    concerns?: string
    status: LeadStatus
    source?: string
    userId?: string
    createdAt?: Timestamp | Date
}

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "converted", "archived"]
const PAGE_SIZE = 10

const STATUS_STYLES: Record<LeadStatus, string> = {
    new: "bg-terra-400/10 text-terra-400 ring-1 ring-terra-400/30",
    contacted: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
    converted: "bg-green-500/10 text-green-700 ring-1 ring-green-500/20",
    archived: "bg-peach-300/30 text-olive-400 ring-1 ring-olive-400/20",
}

/** Lead cards stay fixed-height: converted members can have hundreds of bookings. */
const BOOKINGS_SHOWN_PER_LEAD = 3

const EMPTY_BOOKINGS: Map<string, Booking[]> = new Map()
const EMPTY_CLASSES: Map<string, ClassSession> = new Map()

const BOOKING_STATUS_STYLES: Record<string, string> = {
    confirmed: "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20",
    attended: "bg-green-500/10 text-green-700 ring-1 ring-green-500/20",
    canceled: "bg-red-500/10 text-red-600 ring-1 ring-red-500/20",
    "no-show": "bg-yellow-500/10 text-yellow-700 ring-1 ring-yellow-500/20",
}

function fmtTime(t?: string) {
    if (!t) return ""
    const [h, m] = t.split(":").map(Number)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return t
    const period = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`
}

function fmtClassDate(date: Date | string) {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
    })
}

function formatCreatedAt(createdAt?: Timestamp | Date | string | number | { seconds?: number; toDate?: () => Date }): string {
    if (!createdAt) return ""
    if (createdAt instanceof Date) return createdAt.toLocaleString()
    if (typeof createdAt === "string" || typeof createdAt === "number") {
        return new Date(createdAt).toLocaleString()
    }
    if (typeof createdAt.toDate === "function") {
        return createdAt.toDate().toLocaleString()
    }
    if (typeof createdAt.seconds === "number") {
        return new Date(createdAt.seconds * 1000).toLocaleString()
    }
    return ""
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | LeadStatus>("all")
    const [page, setPage] = useState(1)
    // Stamped with the page of user ids it was fetched for, so a page change
    // renders as loading instead of briefly showing the previous page's classes.
    const [bookingSnapshot, setBookingSnapshot] = useState<{
        key: string
        byUser: Map<string, Booking[]>
        classes: Map<string, ClassSession>
    } | null>(null)

    useEffect(() => {
        let cancelled = false

        getDocs(query(collection(db, "introClassLeads"), orderBy("createdAt", "desc")))
            .then((snapshot) => {
                if (cancelled) return
                setLeads(snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                })) as Lead[])
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load leads")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    const updateStatus = async (id: string, status: LeadStatus) => {
        try {
            await updateDoc(doc(db, "introClassLeads", id), { status })
            setLeads(prev => prev.map((lead) => lead.id === id ? { ...lead, status } : lead))
            toast.success(`Marked as ${status}`)
        } catch {
            toast.error("Failed to update status")
        }
    }

    const filtered = filter === "all" ? leads : leads.filter((lead) => lead.status === filter)
    const totalLeads = leads.length
    const totalFilteredLeads = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalFilteredLeads / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const paginated = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    )
    const counts = STATUS_OPTIONS.reduce<Record<string, number>>(
        (acc, s) => ({ ...acc, [s]: leads.filter((l) => l.status === s).length }),
        { all: totalLeads },
    )

    // Which class did each lead actually book? The lead record is written at
    // payment time and carries no class, so the bookings have to be looked up
    // by user. Only the visible page is fetched — one query per page of leads.
    const pageUserIdsKey = paginated
        .map((lead) => lead.userId || lead.id)
        .filter(Boolean)
        .join(",")

    useEffect(() => {
        const userIds = pageUserIdsKey ? pageUserIdsKey.split(",") : []
        if (userIds.length === 0) return

        let cancelled = false

        getEarliestBookingsPerUser(userIds, BOOKINGS_SHOWN_PER_LEAD)
            .then(async (grouped) => {
                const classIds = Array.from(grouped.values())
                    .flat()
                    .map((b) => b.classId)
                const classes = await getClassesByIds(classIds)
                if (cancelled) return
                setBookingSnapshot({ key: pageUserIdsKey, byUser: grouped, classes })
            })
            .catch((err: unknown) => {
                if (cancelled) return
                // Surface the real cause — a missing Firestore index reads as a
                // generic failure otherwise, and the console link is the fix.
                console.error("Failed to load booked classes", err)
                const message = err instanceof Error ? err.message : ""
                toast.error(
                    message.includes("requires an index")
                        ? "Booked classes need a Firestore index that has not been deployed yet"
                        : "Failed to load booked classes",
                )
            })

        return () => {
            cancelled = true
        }
    }, [pageUserIdsKey])

    const bookingsReady = bookingSnapshot?.key === pageUserIdsKey
    const bookingsByUser = bookingsReady ? bookingSnapshot.byUser : EMPTY_BOOKINGS
    const classMap = bookingsReady ? bookingSnapshot.classes : EMPTY_CLASSES
    const bookingsLoading = pageUserIdsKey.length > 0 && !bookingsReady

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <header className="space-y-2">
                <h1 className="app-page-title">
                    Demo Class Leads
                </h1>
                <p className="app-body">
                    Submissions from the public intro-class signup form.
                </p>
            </header>

            <div className="flex flex-wrap gap-2">
                {(["all", ...STATUS_OPTIONS] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => {
                            setFilter(s)
                            setPage(1)
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            filter === s
                                ? "bg-terra-400 text-peach-50 shadow-lg shadow-terra-400/20"
                                : "bg-peach-200/40 text-olive-400 hover:bg-peach-300/60"
                        }`}
                    >
                        {s} <span className="ml-1 opacity-70">({counts[s] ?? 0})</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-olive-400">Loading…</p>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-peach-400/30 bg-peach-50 p-12 text-center">
                    <p className="text-olive-400">No leads in this view yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {paginated.map((lead) => (
                        <article
                            key={lead.id}
                            className="rounded-2xl border border-peach-400/30 bg-peach-50 p-6 space-y-4"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="app-card-title">
                                        {lead.name || <span className="text-olive-300 italic font-normal text-sm">No name provided</span>}
                                    </h3>
                                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm text-olive-400">
                                        {lead.email && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" /> {lead.email}
                                            </span>
                                        )}
                                        {lead.phone && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5" /> {lead.phone}
                                            </span>
                                        )}
                                        {lead.createdAt && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatCreatedAt(lead.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full app-badge-text ${STATUS_STYLES[lead.status] ?? STATUS_STYLES.new}`}
                                >
                                    {lead.status ?? "new"}
                                </span>
                            </div>

                            {/* Which class this lead actually booked */}
                            <div className="pt-3 border-t border-peach-400/20">
                                <p className="app-label mb-2">First classes booked</p>
                                {(() => {
                                    const userId = lead.userId || lead.id
                                    const fetched = bookingsByUser.get(userId) ?? []
                                    // One extra was fetched purely to detect overflow
                                    const hasMore = fetched.length > BOOKINGS_SHOWN_PER_LEAD
                                    const booked = fetched.slice(0, BOOKINGS_SHOWN_PER_LEAD)

                                    if (bookingsLoading && booked.length === 0) {
                                        return <div className="h-5 w-48 bg-peach-200/60 rounded animate-pulse" />
                                    }

                                    if (booked.length === 0) {
                                        return (
                                            <p className="inline-flex items-center gap-2 text-sm text-olive-300">
                                                <CalendarX className="w-4 h-4" />
                                                Paid, but no class booked yet
                                            </p>
                                        )
                                    }

                                    return (
                                        <>
                                            <ul className="space-y-1.5">
                                                {booked.map((booking) => {
                                                    const cls = classMap.get(booking.classId)
                                                    const isDemo = booking.creditType === "intro_credit"
                                                    return (
                                                        <li
                                                            key={booking.id}
                                                            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-olive-600"
                                                        >
                                                            <CalendarCheck className="w-4 h-4 text-terra-400 flex-shrink-0" />
                                                            <span className="font-bold">
                                                                {cls?.classType || "Class"}
                                                            </span>
                                                            {isDemo && (
                                                                <span className="app-badge-text px-2 py-0.5 rounded-full bg-terra-400/10 text-terra-400 ring-1 ring-terra-400/30">
                                                                    Demo
                                                                </span>
                                                            )}
                                                            <span className="text-olive-400">
                                                                {fmtClassDate(booking.classDate)}
                                                                {cls?.startTime && ` · ${fmtTime(cls.startTime)}`}
                                                                {` · Spot #${booking.spotNumber}`}
                                                            </span>
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full app-badge-text ${
                                                                    BOOKING_STATUS_STYLES[booking.status] ?? ""
                                                                }`}
                                                            >
                                                                {booking.status}
                                                            </span>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                            {hasMore && (
                                                <p className="text-xs text-olive-300 mt-2">
                                                    Converted to a member — see every booking on the{" "}
                                                    <Link
                                                        href={`/admin/bookings?q=${encodeURIComponent(lead.email || lead.name || userId)}`}
                                                        className="text-terra-400 font-bold hover:underline"
                                                    >
                                                        bookings page
                                                    </Link>
                                                    .
                                                </p>
                                            )}
                                        </>
                                    )
                                })()}
                            </div>

                            {(lead.goals || lead.concerns) && (
                                <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-peach-400/20">
                                    {lead.goals && (
                                        <div>
                                            <p className="app-label mb-1">
                                                Goals
                                            </p>
                                            <p className="text-sm text-olive-600 leading-relaxed">{lead.goals}</p>
                                        </div>
                                    )}
                                    {lead.concerns && (
                                        <div>
                                            <p className="app-label mb-1">
                                                Concerns
                                            </p>
                                            <p className="text-sm text-olive-600 leading-relaxed">{lead.concerns}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-2">
                                {STATUS_OPTIONS.filter((s) => s !== lead.status).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => updateStatus(lead.id, s)}
                                        className="px-3 py-1.5 rounded-lg app-badge-text bg-peach-200/50 text-olive-400 hover:bg-terra-400 hover:text-peach-50 transition-colors"
                                    >
                                        Mark {s}
                                    </button>
                                ))}
                            </div>
                        </article>
                    ))}
                    <PaginationControls
                        page={currentPage}
                        totalItems={totalFilteredLeads}
                        pageSize={PAGE_SIZE}
                        itemLabel="leads"
                        onPageChange={setPage}
                    />
                </div>
            )}
        </div>
    )
}
