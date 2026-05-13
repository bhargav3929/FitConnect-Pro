"use client"

import { useEffect, useState } from "react"
import { collection, doc, onSnapshot, orderBy, query, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@fitconnect/shared/firebase/config"
import { toast } from "sonner"
import { Mail, Calendar } from "lucide-react"

type WaitlistStatus = "new" | "contacted" | "converted" | "archived"

type WaitlistEntry = {
    id: string
    name: string
    email: string
    status: WaitlistStatus
    createdAt?: Timestamp
}

const STATUS_OPTIONS: WaitlistStatus[] = ["new", "contacted", "converted", "archived"]

const STATUS_STYLES: Record<WaitlistStatus, string> = {
    new: "bg-terra-400/10 text-terra-400 ring-1 ring-terra-400/30",
    contacted: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
    converted: "bg-green-500/10 text-green-700 ring-1 ring-green-500/20",
    archived: "bg-peach-300/30 text-olive-400 ring-1 ring-olive-400/20",
}

export default function WaitlistPage() {
    const [entries, setEntries] = useState<WaitlistEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | WaitlistStatus>("all")

    useEffect(() => {
        const q = query(collection(db, "waitlist"), orderBy("createdAt", "desc"))
        const unsub = onSnapshot(
            q,
            (snap) => {
                setEntries(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WaitlistEntry, "id">) })))
                setLoading(false)
            },
            (err) => {
                console.error(err)
                toast.error("Failed to load waitlist")
                setLoading(false)
            },
        )
        return () => unsub()
    }, [])

    const updateStatus = async (id: string, status: WaitlistStatus) => {
        try {
            await updateDoc(doc(db, "waitlist", id), { status })
            toast.success(`Marked as ${status}`)
        } catch {
            toast.error("Failed to update status")
        }
    }

    const filtered = filter === "all" ? entries : entries.filter((e) => e.status === filter)
    const counts = STATUS_OPTIONS.reduce<Record<string, number>>(
        (acc, s) => ({ ...acc, [s]: entries.filter((e) => e.status === s).length }),
        { all: entries.length },
    )

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <header className="space-y-1">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-terra-400">
                    Founding Membership
                </p>
                <h1 className="text-3xl lg:text-4xl font-black text-olive-600 uppercase tracking-tight font-display">
                    Waitlist
                </h1>
                <p className="text-olive-400 text-sm">
                    People who joined the founding membership waitlist.
                </p>
            </header>

            {/* Stat chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["all", ...STATUS_OPTIONS] as const).map((s) => (
                    <div key={s} className="rounded-2xl border border-peach-400/20 bg-peach-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-olive-400 capitalize">{s}</p>
                        <p className="text-2xl font-black text-olive-600 mt-1">{counts[s] ?? 0}</p>
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
                    {filtered.map((entry) => (
                        <article
                            key={entry.id}
                            className="rounded-2xl border border-peach-400/30 bg-peach-50 p-6"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-olive-600">{entry.name}</h3>
                                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm text-olive-400">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5" />
                                            {entry.email}
                                        </span>
                                        {entry.createdAt && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {entry.createdAt.toDate().toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[entry.status] ?? STATUS_STYLES.new}`}
                                >
                                    {entry.status ?? "new"}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-4 mt-3 border-t border-peach-400/20">
                                {STATUS_OPTIONS.filter((s) => s !== entry.status).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => updateStatus(entry.id, s)}
                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-peach-200/50 text-olive-400 hover:bg-terra-400 hover:text-peach-50 transition-colors capitalize"
                                    >
                                        Mark {s}
                                    </button>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
