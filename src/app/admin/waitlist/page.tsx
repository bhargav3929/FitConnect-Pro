"use client"

import { useEffect, useState } from "react"
import { doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@fitconnect/shared/firebase/config"
import { toast } from "sonner"
import { Mail, Calendar } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import {
    getCollectionPage,
    type FirestorePageCursor,
} from "@fitconnect/shared/firebase/firestore"

type WaitlistStatus = "new" | "contacted" | "converted" | "archived"

type WaitlistEntry = {
    id: string
    name: string
    email: string
    status: WaitlistStatus
    createdAt?: Timestamp | Date
}

const STATUS_OPTIONS: WaitlistStatus[] = ["new", "contacted", "converted", "archived"]
const PAGE_SIZE = 10

const STATUS_STYLES: Record<WaitlistStatus, string> = {
    new: "bg-terra-400/10 text-terra-400 ring-1 ring-terra-400/30",
    contacted: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
    converted: "bg-green-500/10 text-green-700 ring-1 ring-green-500/20",
    archived: "bg-peach-300/30 text-olive-400 ring-1 ring-olive-400/20",
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

export default function WaitlistPage() {
    const [entries, setEntries] = useState<WaitlistEntry[]>([])
    const [totalEntries, setTotalEntries] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | WaitlistStatus>("all")
    const [requestedPage, setRequestedPage] = useState(1)
    const [pageCursors, setPageCursors] = useState<FirestorePageCursor[]>([null])
    const currentCursor = pageCursors[requestedPage - 1] || null

    useEffect(() => {
        let cancelled = false

        getCollectionPage<WaitlistEntry>("waitlist", {
            pageSize: PAGE_SIZE,
            cursor: currentCursor,
            orderField: "createdAt",
            filters: filter === "all" ? undefined : [{ field: "status", op: "==", value: filter }],
        })
            .then((pageResult) => {
                if (cancelled) return
                setEntries(pageResult.items)
                setTotalEntries(pageResult.total)
                setPageCursors(prev => {
                    const next = prev.slice(0, requestedPage)
                    next[requestedPage] = pageResult.nextCursor
                    return next
                })
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load waitlist")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [requestedPage, currentCursor, filter])

    const updateStatus = async (id: string, status: WaitlistStatus) => {
        try {
            await updateDoc(doc(db, "waitlist", id), { status })
            toast.success(`Marked as ${status}`)
        } catch {
            toast.error("Failed to update status")
        }
    }

    const filtered = entries
    const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE))
    const page = Math.min(requestedPage, totalPages)
    const paginated = filtered
    const counts = STATUS_OPTIONS.reduce<Record<string, number>>(
        (acc, s) => ({ ...acc, [s]: entries.filter((e) => e.status === s).length }),
        { all: totalEntries },
    )

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <header className="space-y-1">
                <p className="app-kicker">
                    Founding Membership
                </p>
                <h1 className="app-page-title">
                    Waitlist
                </h1>
                <p className="app-body">
                    People who joined the founding membership waitlist.
                </p>
            </header>

            {/* Stat chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["all", ...STATUS_OPTIONS] as const).map((s) => (
                    <div key={s} className="rounded-2xl border border-peach-400/20 bg-peach-50 p-4">
                        <p className="app-label capitalize">{s}</p>
                        <p className="app-stat-value mt-1">{counts[s] ?? 0}</p>
                    </div>
                ))}
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
                {(["all", ...STATUS_OPTIONS] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => {
                            setFilter(s)
                            setRequestedPage(1)
                            setPageCursors([null])
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all capitalize ${
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
                    <p className="text-olive-400">No entries in this view yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {paginated.map((entry) => (
                        <article
                            key={entry.id}
                            className="rounded-2xl border border-peach-400/30 bg-peach-50 p-6"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="app-card-title">{entry.name}</h3>
                                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm text-olive-400">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5" />
                                            {entry.email}
                                        </span>
                                        {entry.createdAt && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatCreatedAt(entry.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full app-badge-text ${STATUS_STYLES[entry.status] ?? STATUS_STYLES.new}`}
                                >
                                    {entry.status ?? "new"}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-4 mt-3 border-t border-peach-400/20">
                                {STATUS_OPTIONS.filter((s) => s !== entry.status).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => updateStatus(entry.id, s)}
                                        className="px-3 py-1.5 rounded-lg app-badge-text bg-peach-200/50 text-olive-400 hover:bg-terra-400 hover:text-peach-50 transition-colors capitalize"
                                    >
                                        Mark {s}
                                    </button>
                                ))}
                            </div>
                        </article>
                    ))}
                    <PaginationControls
                        page={page}
                        totalItems={totalEntries}
                        pageSize={PAGE_SIZE}
                        itemLabel="entries"
                        onPageChange={setRequestedPage}
                    />
                </div>
            )}
        </div>
    )
}
