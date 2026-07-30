"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
    Search,
    Calendar,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreVertical,
    Trash2,
    Loader2,
    BookOpen,
    UserCheck,
    Ban,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PaginationControls } from "@/components/ui/pagination-controls"
import {
    callCheckInBooking,
    callCancelBooking,
    getBookingStats,
    getBookingsPage,
    getAllMembers,
    getBookingsByUserIds,
    getBookingsByClassId,
    getClassesByIds,
    type FirestorePageCursor,
} from "@fitconnect/shared/firebase/firestore"
import { Booking } from "@fitconnect/shared/types/booking"
import { ClassSession } from "@fitconnect/shared/types/class"
import { UserProfile } from "@fitconnect/shared/types/user"
import { toast } from "sonner"

const STATUS_FILTERS = ["All Status", "confirmed", "attended", "canceled", "no-show"]
const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300
/** Cap on how many matching members a single search will resolve bookings for. */
const MAX_SEARCH_MEMBERS = 300

const EMPTY_BOOKINGS: Booking[] = []

function getBookingUserLabel(booking: Booking) {
    return booking.userName?.trim() || booking.userId
}

function fmtTime(t?: string) {
    if (!t) return ""
    const [h, m] = t.split(":").map(Number)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return t
    const period = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`
}

function matchesMember(member: UserProfile, term: string) {
    return (
        member.name?.toLowerCase().includes(term) ||
        member.displayName?.toLowerCase().includes(term) ||
        member.email?.toLowerCase().includes(term) ||
        member.uid?.toLowerCase().includes(term)
    )
}

function BookingsPageContent() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [totalBookings, setTotalBookings] = useState(0)
    const [bookingStats, setBookingStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        canceledBookings: 0,
        attendedBookings: 0,
        noShowBookings: 0,
        todayBookings: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    // `?q=` lets other admin screens (leads) deep-link straight into a search
    const initialQuery = useSearchParams().get("q") ?? ""
    const [searchQuery, setSearchQuery] = useState(initialQuery)
    const [searchTerm, setSearchTerm] = useState(initialQuery)
    // Stamped with the term and status it was produced for, so a stale result
    // set is never rendered against a newer query.
    const [searchSnapshot, setSearchSnapshot] = useState<{
        term: string
        status: string
        results: Booking[]
        truncated: boolean
    } | null>(null)
    const [classMap, setClassMap] = useState<Map<string, ClassSession>>(new Map())
    const [statusFilter, setStatusFilter] = useState("All Status")
    const [cancelingId, setCancelingId] = useState<string | null>(null)
    const [markingNoShowId, setMarkingNoShowId] = useState<string | null>(null)
    const [requestedPage, setRequestedPage] = useState(1)
    const [pageCursors, setPageCursors] = useState<FirestorePageCursor[]>([null])
    const currentCursor = pageCursors[requestedPage - 1] || null

    // The member directory backs name/email search. Firestore has no substring
    // search, so matching happens here; loaded once and reused across keystrokes.
    const membersRef = useRef<UserProfile[] | null>(null)

    const trimmedSearch = searchTerm.trim()
    const isSearchMode = trimmedSearch.length > 0

    // Debounce the search box so each keystroke does not fire a round of queries
    useEffect(() => {
        const id = setTimeout(() => setSearchTerm(searchQuery), SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(id)
    }, [searchQuery])

    useEffect(() => {
        let cancelled = false

        getBookingStats()
            .then((stats) => {
                if (!cancelled) setBookingStats(stats)
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load booking stats")
            })

        return () => {
            cancelled = true
        }
    }, [])

    // Browse mode — server-paginated listing
    useEffect(() => {
        if (isSearchMode) return
        let cancelled = false

        getBookingsPage({
            pageSize: PAGE_SIZE,
            cursor: currentCursor,
            status: statusFilter === "All Status" ? undefined : statusFilter as Booking['status'],
        })
            .then((pageResult) => {
                if (cancelled) return
                setBookings(pageResult.items)
                setTotalBookings(pageResult.total)
                setPageCursors(prev => {
                    const next = prev.slice(0, requestedPage)
                    next[requestedPage] = pageResult.nextCursor
                    return next
                })
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load bookings")
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [requestedPage, currentCursor, statusFilter, isSearchMode])

    // Search mode — resolve the term against members (name/email/uid) and against
    // a literal class id, then query the whole bookings collection for the matches.
    useEffect(() => {
        if (!isSearchMode) return

        let cancelled = false
        const term = trimmedSearch.toLowerCase()
        const status = statusFilter === "All Status"
            ? undefined
            : statusFilter as Booking['status']

        ;(async () => {
            try {
                if (!membersRef.current) {
                    membersRef.current = await getAllMembers()
                }
                if (cancelled) return

                const matched = membersRef.current.filter((m) => matchesMember(m, term))
                const truncated = matched.length > MAX_SEARCH_MEMBERS
                const userIds = matched.slice(0, MAX_SEARCH_MEMBERS).map((m) => m.uid)

                const [byUser, byClass] = await Promise.all([
                    getBookingsByUserIds(userIds, { status }),
                    // The raw term may itself be a class id pasted from elsewhere
                    getBookingsByClassId(trimmedSearch),
                ])
                if (cancelled) return

                const merged = new Map<string, Booking>()
                for (const booking of byUser) merged.set(booking.id, booking)
                for (const booking of byClass) {
                    if (!status || booking.status === status) merged.set(booking.id, booking)
                }

                setSearchSnapshot({
                    term: trimmedSearch,
                    status: statusFilter,
                    results: Array.from(merged.values()).sort(
                        (a, b) => new Date(b.classDate).getTime() - new Date(a.classDate).getTime(),
                    ),
                    truncated,
                })
            } catch {
                if (cancelled) return
                toast.error("Search failed")
                setSearchSnapshot({
                    term: trimmedSearch,
                    status: statusFilter,
                    results: [],
                    truncated: false,
                })
            }
        })()

        return () => {
            cancelled = true
        }
    }, [trimmedSearch, isSearchMode, statusFilter])

    const searchReady =
        isSearchMode &&
        searchSnapshot?.term === trimmedSearch &&
        searchSnapshot?.status === statusFilter
    const searchResults = searchReady ? searchSnapshot.results : EMPTY_BOOKINGS
    const searchTruncated = searchReady ? searchSnapshot.truncated : false
    const isSearchLoading = isSearchMode && !searchReady

    const handleCancelBooking = async (bookingId: string) => {
        setCancelingId(bookingId)
        try {
            await callCancelBooking(bookingId)
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: 'canceled' as const } : b
            ))
            const stats = await getBookingStats()
            setBookingStats(stats)
            toast.success("Booking cancelled")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to cancel booking"
            toast.error(message)
        } finally {
            setCancelingId(null)
        }
    }

    const handleMarkNoShow = async (bookingId: string) => {
        setMarkingNoShowId(bookingId)
        try {
            await callCheckInBooking(bookingId, 'no-show')
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: 'no-show' as const } : b
            ))
            const stats = await getBookingStats()
            setBookingStats(stats)
            toast.success("Booking marked as no-show")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to mark no-show"
            toast.error(message)
        } finally {
            setMarkingNoShowId(null)
        }
    }

    // Browse mode paginates on the server; search mode holds the full result set
    // in memory and pages through it here.
    const displayedSource = isSearchMode ? searchResults : bookings
    const totalItems = isSearchMode ? searchResults.length : totalBookings
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
    const page = Math.min(requestedPage, totalPages)
    const paginatedBookings = isSearchMode
        ? displayedSource.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        : displayedSource
    const showLoading = isSearchMode ? isSearchLoading : isLoading

    // Resolve the class behind each booking so rows can name the session
    useEffect(() => {
        const classIds = displayedSource.map((b) => b.classId).filter(Boolean)
        // Nothing to add. The existing map is keyed by class id, so leaving it
        // in place can only ever hold extra entries, never mislabel a row.
        if (classIds.length === 0) return

        let cancelled = false
        getClassesByIds(classIds)
            .then((map) => {
                if (!cancelled) setClassMap(map)
            })
            .catch(() => {
                // A missing class only degrades the label; the row still renders
            })

        return () => {
            cancelled = true
        }
    }, [displayedSource])

    const getClassLabel = (booking: Booking) => {
        const cls = classMap.get(booking.classId)
        if (!cls) return { title: "Unknown class", subtitle: booking.classId }
        return {
            title: cls.classType || "Class",
            subtitle: [fmtTime(cls.startTime), cls.location].filter(Boolean).join(" · "),
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <AlertCircle className="w-3 h-3" />
            case 'attended': return <CheckCircle2 className="w-3 h-3" />
            case 'canceled': return <XCircle className="w-3 h-3" />
            case 'no-show': return <Ban className="w-3 h-3" />
            default: return null
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20'
            case 'attended': return 'bg-green-500/10 text-green-700 ring-1 ring-green-500/20'
            case 'canceled': return 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20'
            case 'no-show': return 'bg-yellow-500/10 text-yellow-700 ring-1 ring-yellow-500/20'
            default: return 'bg-peach-300/30 text-olive-400'
        }
    }

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatDateTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
        })
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20 lg:pb-0">
            {/* Premium Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-peach-400/20"
            >
                <div>
                    <h2 className="app-page-title mb-2">
                        Bookings
                    </h2>
                    <p className="app-page-subtitle">
                        Track and manage all class reservations, attendance, and cancellations.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {!isLoading && (
                        <span className="text-olive-300 text-xs font-mono bg-peach-200/50 px-3 py-1.5 rounded-full border border-peach-400/20 flex items-center gap-2">
                            <BookOpen className="w-3 h-3" />
                            {bookingStats.totalBookings} total
                        </span>
                    )}
                </div>
            </motion.div>

            {/* Status Summary Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {[
                    { label: "Attended", value: bookingStats.attendedBookings, icon: CheckCircle2, color: "text-green-600" },
                    { label: "Confirmed", value: bookingStats.confirmedBookings, icon: UserCheck, color: "text-blue-500" },
                    { label: "Canceled", value: bookingStats.canceledBookings, icon: XCircle, color: "text-red-500" },
                    { label: "No-Show", value: bookingStats.noShowBookings, icon: Ban, color: "text-yellow-600" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="group relative overflow-hidden bg-peach-50 border border-peach-400/20 p-5 hover:border-terra-400/30 transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-terra-400/5 rounded-full blur-2xl -mr-12 -mt-12 transition-opacity opacity-0 group-hover:opacity-100 duration-500" />
                        <stat.icon className={`w-5 h-5 mb-3 ${stat.color}`} />
                        {isLoading ? (
                            <div className="h-8 w-16 bg-peach-300/40 rounded animate-pulse mb-1" />
                        ) : (
                            <p className="app-stat-value">{stat.value}</p>
                        )}
                        <p className="app-stat-label mt-1">{stat.label}</p>
                    </div>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300 group-focus-within:text-terra-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search all bookings by name, email, or class ID..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setRequestedPage(1)
                        }}
                        className="w-full h-12 pl-11 pr-11 bg-peach-50 border border-peach-400/20 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:outline-none focus:bg-peach-50 transition-all duration-300"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery("")
                                setRequestedPage(1)
                            }}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-olive-300 hover:text-olive-600 transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setRequestedPage(1)
                        setPageCursors([null])
                    }}
                    className="h-12 px-4 bg-peach-50 border border-peach-400/20 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer capitalize hover:border-peach-400/40 transition-colors"
                >
                    {STATUS_FILTERS.map(status => (
                        <option key={status} value={status} className="capitalize">{status}</option>
                    ))}
                </select>
            </motion.div>

            {/* Search context line */}
            {isSearchMode && !showLoading && (
                <p className="text-sm text-olive-400 -mt-2">
                    {totalItems === 0
                        ? <>No bookings match <span className="font-bold text-olive-600">{trimmedSearch}</span>.</>
                        : <>{totalItems} booking{totalItems === 1 ? "" : "s"} across all pages match <span className="font-bold text-olive-600">{trimmedSearch}</span>.</>}
                    {searchTruncated && (
                        <span className="text-yellow-700"> Showing the first {MAX_SEARCH_MEMBERS} matching members only — narrow your search.</span>
                    )}
                </p>
            )}

            {/* Loading State */}
            {showLoading && (
                <div className="bg-peach-50 border border-peach-400/20 overflow-hidden">
                    <div className="divide-y divide-peach-400/10">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="p-5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 bg-peach-300/30 rounded-full" />
                                        <div>
                                            <div className="h-4 w-36 bg-peach-300/30 rounded mb-2" />
                                            <div className="h-3 w-24 bg-peach-200/50 rounded" />
                                        </div>
                                    </div>
                                    <div className="hidden lg:flex items-center gap-8">
                                        <div className="h-5 w-20 bg-peach-200/50 rounded" />
                                        <div className="h-5 w-24 bg-peach-200/50 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bookings Table */}
            {!showLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-peach-50 border border-peach-400/20 overflow-hidden"
                >
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-peach-400/15 bg-peach-200/30">
                                    <th className="text-left app-label p-4 pl-6">User</th>
                                    <th className="text-left app-label p-4">Class</th>
                                    <th className="text-left app-label p-4">Spot</th>
                                    <th className="text-left app-label p-4">Class Date</th>
                                    <th className="text-left app-label p-4">Status</th>
                                    <th className="text-left app-label p-4">Booked At</th>
                                    <th className="text-left app-label p-4">Guest</th>
                                    <th className="text-right app-label p-4 pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBookings.map((booking, idx) => {
                                    const isActionLoading = cancelingId === booking.id || markingNoShowId === booking.id
                                    return (
                                        <motion.tr
                                            key={booking.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.35 + idx * 0.03 }}
                                            className="border-b border-peach-400/8 hover:bg-peach-100/80 transition-colors duration-200 group"
                                        >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 bg-peach-200/60 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-terra-400/10 transition-colors">
                                                    <User className="w-4 h-4 text-olive-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-olive-600 text-sm truncate max-w-[160px]">
                                                        {getBookingUserLabel(booking)}
                                                    </p>
                                                    {booking.userName && (
                                                        <p className="text-[10px] text-olive-300 truncate max-w-[160px]">
                                                            {booking.userId}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {(() => {
                                                const { title, subtitle } = getClassLabel(booking)
                                                return (
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-olive-600 text-sm truncate max-w-[180px]">{title}</p>
                                                        {subtitle && (
                                                            <p className="text-[11px] text-olive-300 truncate max-w-[180px]">{subtitle}</p>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-olive-600 font-black text-lg tracking-normal">#{booking.spotNumber}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-olive-300">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-sm">{formatDate(booking.classDate)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 app-badge-text rounded-sm ${getStatusColor(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-olive-300 text-sm">
                                                <Clock className="w-3 h-3" />
                                                {formatDateTime(booking.bookingDate)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold ${booking.isGuest ? 'text-terra-400 bg-terra-400/8 px-2 py-0.5 ring-1 ring-terra-400/15 rounded-sm' : 'text-olive-300'}`}>
                                                {booking.isGuest ? 'Guest' : 'No'}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-olive-600 hover:bg-peach-200/50 rounded-md transition-all">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-peach-50/95 backdrop-blur-xl border-peach-400/15 shadow-xl shadow-black/5">
                                                    {booking.status === 'confirmed' && (
                                                        <>
                                                            <DropdownMenuItem
                                                                className="text-yellow-700 focus:bg-yellow-500/10 focus:text-yellow-800 cursor-pointer gap-2"
                                                                onClick={() => handleMarkNoShow(booking.id)}
                                                                disabled={isActionLoading}
                                                            >
                                                                {markingNoShowId === booking.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Ban className="w-4 h-4" />
                                                                )}
                                                                Mark No Show
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer gap-2"
                                                                onClick={() => handleCancelBooking(booking.id)}
                                                                disabled={isActionLoading}
                                                            >
                                                                {cancelingId === booking.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                                Cancel Booking
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {booking.status !== 'confirmed' && (
                                                        <DropdownMenuItem disabled className="text-olive-300 gap-2">
                                                            No actions available
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        </motion.tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden divide-y divide-peach-400/10">
                        {paginatedBookings.map((booking, idx) => {
                            const isActionLoading = cancelingId === booking.id || markingNoShowId === booking.id
                            return (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + idx * 0.05 }}
                                    className="p-4 hover:bg-peach-100/60 transition-colors"
                                >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-peach-200/60 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-olive-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-olive-600 text-sm truncate max-w-[200px]">{getBookingUserLabel(booking)}</p>
                                            {booking.userName && (
                                                <p className="text-[10px] text-olive-300 truncate max-w-[200px]">{booking.userId}</p>
                                            )}
                                            <p className="text-xs text-olive-500 font-medium mt-0.5 truncate max-w-[200px]">
                                                {getClassLabel(booking).title}
                                                {getClassLabel(booking).subtitle && (
                                                    <span className="text-olive-300 font-normal"> · {getClassLabel(booking).subtitle}</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-olive-300 mt-0.5">Spot #{booking.spotNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 app-badge-text rounded-sm ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            {booking.status}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-olive-600 hover:bg-peach-200/50 rounded-md transition-all">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-peach-50/95 backdrop-blur-xl border-peach-400/15 shadow-xl shadow-black/5">
                                                {booking.status === 'confirmed' && (
                                                    <>
                                                        <DropdownMenuItem
                                                            className="text-yellow-700 focus:bg-yellow-500/10 focus:text-yellow-800 cursor-pointer gap-2"
                                                            onClick={() => handleMarkNoShow(booking.id)}
                                                            disabled={isActionLoading}
                                                        >
                                                            {markingNoShowId === booking.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Ban className="w-4 h-4" />
                                                            )}
                                                            Mark No Show
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer gap-2"
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                            disabled={isActionLoading}
                                                        >
                                                            {cancelingId === booking.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                            Cancel Booking
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {booking.status !== 'confirmed' && (
                                                    <DropdownMenuItem disabled className="text-olive-300 gap-2">
                                                        No actions available
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-olive-300 ml-[42px]">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(booking.classDate)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDateTime(booking.bookingDate)}
                                    </div>
                                </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {paginatedBookings.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-peach-200/40 flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-olive-300/30" />
                            </div>
                            <p className="text-olive-600 font-bold mb-1">No bookings found</p>
                            <p className="text-olive-300 text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                    {paginatedBookings.length > 0 && (
                        <PaginationControls
                            page={page}
                            totalItems={totalItems}
                            pageSize={PAGE_SIZE}
                            itemLabel="bookings"
                            onPageChange={setRequestedPage}
                        />
                    )}
                </motion.div>
            )}

            {/* Footer Summary */}
            {!showLoading && paginatedBookings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between text-olive-300 text-xs tracking-wider"
                >
                    <span>Showing {paginatedBookings.length} of {totalItems} bookings</span>
                    <span className="font-mono bg-peach-200/30 px-3 py-1 rounded-full border border-peach-400/15">
                        {bookingStats.attendedBookings} attended &bull; {bookingStats.confirmedBookings} pending
                    </span>
                </motion.div>
            )}
        </div>
    )
}

export default function BookingsPage() {
    // useSearchParams needs a boundary so the route is not forced to client rendering
    return (
        <Suspense fallback={null}>
            <BookingsPageContent />
        </Suspense>
    )
}
