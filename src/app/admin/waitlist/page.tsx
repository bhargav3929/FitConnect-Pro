"use client"

import { useEffect, useState } from "react"
import { collection, doc, getDocs, orderBy, query, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@fitconnect/shared/firebase/config"
import { toast } from "sonner"
import { Mail, Calendar, Phone } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"

type WaitlistStatus = "new" | "contacted" | "converted" | "archived"

type WaitlistEntry = {
    id: string
    name: string
    phone?: string
    contactNumber?: string
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
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | WaitlistStatus>("all")
    const [page, setPage] = useState(1)

    useEffect(() => {
        let cancelled = false

        getDocs(query(collection(db, "waitlist"), orderBy("createdAt", "desc")))
            .then((snapshot) => {
                if (cancelled) return
                setEntries(snapshot.docs.map((docSnap) => {
                    const data = docSnap.data()
                    return {
                        id: docSnap.id,
                        ...data,
                        phone: typeof data.phone === "string"
                            ? data.phone
                            : typeof data.contactNumber === "string"
                                ? data.contactNumber
                                : "",
                    }
                }) as WaitlistEntry[])
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
    }, [])

    useEffect(() => {
        setPage(1)
    }, [filter])

    const updateStatus = async (id: string, status: WaitlistStatus) => {
        try {
            await updateDoc(doc(db, "waitlist", id), { status })
            setEntries(prev => prev.map((entry) => entry.id === id ? { ...entry, status } : entry))
            toast.success(`Marked as ${status}`)
        } catch {
            toast.error("Failed to update status")
        }
    }

    const filtered = filter === "all" ? entries : entries.filter((entry) => entry.status === filter)
    const totalEntries = entries.length
    const totalFilteredEntries = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalFilteredEntries / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const paginated = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    )
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
                        onClick={() => setFilter(s)}
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
                                <div className="min-w-0 flex-1">
                                    <h3 className="app-card-title">{entry.name}</h3>
                                    <div className="grid gap-3 mt-4 sm:grid-cols-3">
                                        <div className="rounded-xl bg-peach-100/70 border border-peach-400/20 px-4 py-3 min-w-0">
                                            <p className="app-label mb-1">Name</p>
                                            <p className="text-sm font-semibold text-olive-600 truncate">{entry.name}</p>
                                        </div>
                                        <div className="rounded-xl bg-peach-100/70 border border-peach-400/20 px-4 py-3 min-w-0">
                                            <p className="app-label mb-1">Contact Number</p>
                                            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-600 truncate">
                                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{entry.phone || "—"}</span>
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-peach-100/70 border border-peach-400/20 px-4 py-3 min-w-0">
                                            <p className="app-label mb-1">Email</p>
                                            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-600 truncate">
                                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{entry.email}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-olive-400">
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
                        page={currentPage}
                        totalItems={totalFilteredEntries}
                        pageSize={PAGE_SIZE}
                        itemLabel="entries"
                        onPageChange={setPage}
                    />
                </div>
            )}
        </div>
    )
}
