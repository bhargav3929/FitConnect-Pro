"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle, XCircle, Loader2, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/ui/pagination-controls"
import Link from "next/link"
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore"
import {
    callCancelBooking,
    getUserBookingsPage,
    type FirestorePageCursor,
} from "@fitconnect/shared/firebase/firestore"
import { Booking } from "@fitconnect/shared/types/booking"
import { toast } from "sonner"

interface EnrichedBooking extends Booking {
    classType?: string
    classStartTime?: string
    classDuration?: number
    classLocation?: string
    trainerName?: string
}

const PAGE_SIZE = 6

export default function BookingsPage() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
    const [bookings, setBookings] = useState<EnrichedBooking[]>([])
    const [totalBookings, setTotalBookings] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [cancelingId, setCancelingId] = useState<string | null>(null)
    const [requestedPage, setRequestedPage] = useState(1)
    const [pageCursors, setPageCursors] = useState<FirestorePageCursor[]>([null])
    const { firebaseUser } = useClientAuthStore()
    const currentCursor = pageCursors[requestedPage - 1] || null

    useEffect(() => {
        if (!firebaseUser) return

        let cancelled = false
        const userId = firebaseUser.uid

        async function loadBookings() {
            setIsLoading(true)
            const page = await getUserBookingsPage(userId, {
                pageSize: PAGE_SIZE,
                cursor: currentCursor,
                statuses: activeTab === 'upcoming'
                    ? ['confirmed']
                    : ['attended', 'canceled', 'no-show'],
                direction: activeTab === 'upcoming' ? 'asc' : 'desc',
            })
            if (cancelled) return
            setBookings(page.items as EnrichedBooking[])
            setTotalBookings(page.total)
            setPageCursors(prev => {
                const next = prev.slice(0, requestedPage)
                next[requestedPage] = page.nextCursor
                return next
            })
            setIsLoading(false)
        }

        loadBookings().catch(() => {
            if (!cancelled) setIsLoading(false)
        })

        return () => {
            cancelled = true
        }
    }, [firebaseUser, activeTab, requestedPage, currentCursor])

    const attendedCount = bookings.filter(b => b.status === 'attended').length
    const MILESTONE_STEP = 50
    const nextMilestone = (Math.floor(attendedCount / MILESTONE_STEP) + 1) * MILESTONE_STEP
    const progressPct = Math.min(100, (attendedCount % MILESTONE_STEP) / MILESTONE_STEP * 100)
    const milestoneTiers = [50, 100, 150]

    const filteredBookings = bookings
    const totalPages = Math.max(1, Math.ceil(totalBookings / PAGE_SIZE))
    const page = Math.min(requestedPage, totalPages)
    const paginatedBookings = filteredBookings

    const handleCancel = async (bookingId: string) => {
        setCancelingId(bookingId)
        try {
            await callCancelBooking(bookingId)
            toast.success("Booking cancelled", {
                description: "Your booking has been cancelled and your class credit has been restored.",
            })
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to cancel booking"
            toast.error("Cancel failed", { description: message })
        } finally {
            setCancelingId(null)
        }
    }

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        if (isToday) return `Today, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-terra-400/15 text-terra-400'
            case 'attended': return 'bg-green-500/15 text-green-600'
            case 'canceled': return 'bg-red-500/15 text-red-600'
            case 'no-show': return 'bg-red-500/15 text-red-600'
            default: return 'bg-peach-300/30 text-olive-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <AlertCircle className="w-3 h-3" />
            case 'attended': return <CheckCircle2 className="w-3 h-3" />
            case 'canceled': return <XCircle className="w-3 h-3" />
            case 'no-show': return <XCircle className="w-3 h-3" />
            default: return null
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="app-page-title">My Bookings</h1>
                <p className="app-page-subtitle mt-1">
                    Manage your upcoming classes and view history
                </p>
            </div>

            {/* Milestones */}
            <div className="bg-peach-50 border border-peach-400/20 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <span className="app-kicker block mb-2">
                            Practice Milestones
                        </span>
                        <h2 className="app-section-title">
                            {attendedCount} / {nextMilestone} classes
                        </h2>
                        <p className="text-olive-300 text-xs mt-1">
                            {nextMilestone - attendedCount} to your next milestone
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {milestoneTiers.map((tier) => {
                            const earned = attendedCount >= tier
                            return (
                                <div
                                    key={tier}
                                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border ${
                                        earned
                                            ? 'bg-terra-400 text-peach-50 border-terra-400'
                                            : 'bg-transparent text-olive-300 border-peach-400/30'
                                    }`}
                                    title={`${tier} classes`}
                                >
                                    <Award className="w-4 h-4" />
                                    <span className="app-badge-text mt-0.5">{tier}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="h-2 bg-peach-200/60 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-terra-400 to-terra-300 rounded-full"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-peach-200/50 rounded-xl w-fit">
                {(['upcoming', 'past'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab)
                            setRequestedPage(1)
                            setPageCursors([null])
                        }}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                                ? 'bg-terra-400 text-peach-50 shadow-lg'
                                : 'text-olive-400 hover:text-olive-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-peach-50 border border-peach-400/20 p-6 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="h-5 w-20 bg-peach-300/40 rounded-full mb-3" />
                                    <div className="h-6 w-36 bg-peach-300/40 rounded mb-2" />
                                    <div className="h-4 w-24 bg-peach-200/60 rounded" />
                                </div>
                                <div className="text-right">
                                    <div className="h-8 w-14 bg-peach-300/40 rounded" />
                                    <div className="h-3 w-8 bg-peach-200/60 rounded mt-1" />
                                </div>
                            </div>
                            <div className="bg-peach-200/40 p-4 space-y-3 mb-6">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="flex items-center justify-between">
                                        <div className="h-4 w-16 bg-peach-200/60 rounded" />
                                        <div className="h-4 w-24 bg-peach-300/40 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bookings Grid */}
            {!isLoading && (
                <div className="grid md:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {paginatedBookings.map((booking, idx) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-peach-50 border border-peach-400/20 p-6 group hover:border-terra-400/30 transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full app-badge-text mb-3 ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            {booking.status}
                                        </div>
                                        <h3 className="app-section-title mb-1 group-hover:text-terra-400 transition-colors">
                                            {booking.classType || 'Pilates Class'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-olive-300 text-sm">
                                            <User className="w-3 h-3" />
                                            <span>{booking.trainerName || 'Instructor'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="app-stat-value">
                                            {booking.classStartTime || booking.spotNumber}
                                        </p>
                                        <p className="text-xs font-bold text-olive-300 uppercase">
                                            Spot {booking.spotNumber}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-peach-200/40 p-4 space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-olive-300">
                                            <Calendar className="w-4 h-4" />
                                            Date
                                        </span>
                                        <span className="font-medium text-olive-600">
                                            {formatDate(booking.classDate)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-olive-300">
                                            <Clock className="w-4 h-4" />
                                            Duration
                                        </span>
                                        <span className="font-medium text-olive-600">
                                            {booking.classDuration ? `${booking.classDuration} min` : '--'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-olive-300">
                                            <MapPin className="w-4 h-4" />
                                            Location
                                        </span>
                                        <span className="font-medium text-olive-600">
                                            {booking.classLocation || 'Main Studio'}
                                        </span>
                                    </div>
                                </div>

                                {activeTab === 'upcoming' && (
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-bold rounded-xl"
                                            onClick={() => handleCancel(booking.id)}
                                            disabled={cancelingId === booking.id}
                                        >
                                            {cancelingId === booking.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Cancel"
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => window.open('https://maps.google.com/?q=250+West+54th+Street+New+York+NY+10019', '_blank')}
                                            className="flex-1 h-12 bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold rounded-xl"
                                        >
                                            Get Directions
                                        </Button>
                                    </div>
                                )}

                                {activeTab === 'past' && booking.status === 'attended' && (
                                    <Link href="/user/schedule">
                                        <Button className="w-full h-12 bg-peach-200/50 text-olive-600 hover:bg-peach-200/80 font-bold rounded-xl border border-peach-400/20">
                                            Book Again
                                        </Button>
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {!isLoading && filteredBookings.length > 0 && (
                <PaginationControls
                    page={page}
                    totalItems={totalBookings}
                    pageSize={PAGE_SIZE}
                    itemLabel="bookings"
                    onPageChange={setRequestedPage}
                />
            )}

            {!isLoading && filteredBookings.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-peach-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-olive-300/40" />
                    </div>
                    <h3 className="app-card-title">No bookings found</h3>
                    <p className="text-olive-300 text-sm mb-6">
                        {activeTab === 'upcoming'
                            ? "You don't have any upcoming classes scheduled."
                            : "You haven't completed any classes yet."
                        }
                    </p>
                    {activeTab === 'upcoming' && (
                        <Link href="/user/schedule">
                            <Button className="font-bold rounded-xl px-8 bg-terra-400 text-peach-50 hover:bg-terra-300">
                                Browse Schedule
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
