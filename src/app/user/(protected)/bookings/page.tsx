"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useClientAuthStore } from "@/lib/store/clientAuthStore"
import { subscribeToUserBookings, callCancelBooking } from "@/lib/firebase/firestore"
import { Booking } from "@/types/booking"
import { toast } from "sonner"

interface EnrichedBooking extends Booking {
    classType?: string
    classStartTime?: string
    classDuration?: number
    classLocation?: string
    trainerName?: string
}

export default function BookingsPage() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
    const [bookings, setBookings] = useState<EnrichedBooking[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [cancelingId, setCancelingId] = useState<string | null>(null)
    const { firebaseUser } = useClientAuthStore()

    useEffect(() => {
        if (!firebaseUser) return

        const unsubscribe = subscribeToUserBookings(firebaseUser.uid, (data) => {
            setBookings(data as EnrichedBooking[])
            setIsLoading(false)
        })
        return () => unsubscribe()
    }, [firebaseUser])

    const filteredBookings = bookings.filter(booking => {
        if (activeTab === 'upcoming') return booking.status === 'confirmed'
        return booking.status === 'attended' || booking.status === 'canceled' || booking.status === 'no-show'
    })

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
            case 'confirmed': return 'bg-terra-400/20 text-terra-400'
            case 'attended': return 'bg-green-500/20 text-green-400'
            case 'canceled': return 'bg-red-500/20 text-red-400'
            case 'no-show': return 'bg-red-500/20 text-red-400'
            default: return 'bg-peach-200/10 text-peach-400'
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
                <h1 className="text-3xl font-black text-peach-200 tracking-tight font-display">My Bookings</h1>
                <p className="text-olive-400 text-sm mt-1">
                    Manage your upcoming classes and view history
                </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-peach-200/5 rounded-xl w-fit">
                {(['upcoming', 'past'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                                ? 'bg-terra-400 text-peach-50 shadow-lg'
                                : 'text-peach-400 hover:text-peach-200'
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
                        <div key={i} className="bg-warmDark-700 border border-peach-400/10 rounded-2xl p-6 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="h-5 w-20 bg-peach-200/10 rounded-full mb-3" />
                                    <div className="h-6 w-36 bg-peach-200/10 rounded mb-2" />
                                    <div className="h-4 w-24 bg-peach-200/5 rounded" />
                                </div>
                                <div className="text-right">
                                    <div className="h-8 w-14 bg-peach-200/10 rounded" />
                                    <div className="h-3 w-8 bg-peach-200/5 rounded mt-1" />
                                </div>
                            </div>
                            <div className="bg-peach-200/5 rounded-xl p-4 space-y-3 mb-6">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="flex items-center justify-between">
                                        <div className="h-4 w-16 bg-peach-200/5 rounded" />
                                        <div className="h-4 w-24 bg-peach-200/10 rounded" />
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
                        {filteredBookings.map((booking, idx) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-warmDark-700 border border-peach-400/10 rounded-2xl p-6 group hover:border-terra-400/30 transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            {booking.status}
                                        </div>
                                        <h3 className="text-xl font-bold text-peach-200 mb-1 group-hover:text-terra-400 transition-colors">
                                            {booking.classType || 'Pilates Class'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-peach-400 text-sm">
                                            <User className="w-3 h-3" />
                                            <span>{booking.trainerName || 'Instructor'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-2xl text-peach-200">
                                            {booking.classStartTime || booking.spotNumber}
                                        </p>
                                        <p className="text-xs font-bold text-olive-400 uppercase">
                                            Spot {booking.spotNumber}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-peach-200/5 rounded-xl p-4 space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-peach-400">
                                            <Calendar className="w-4 h-4" />
                                            Date
                                        </span>
                                        <span className="font-medium text-peach-200">
                                            {formatDate(booking.classDate)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-peach-400">
                                            <Clock className="w-4 h-4" />
                                            Duration
                                        </span>
                                        <span className="font-medium text-peach-200">
                                            {booking.classDuration ? `${booking.classDuration} min` : '--'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-peach-400">
                                            <MapPin className="w-4 h-4" />
                                            Location
                                        </span>
                                        <span className="font-medium text-peach-200">
                                            {booking.classLocation || 'Main Studio'}
                                        </span>
                                    </div>
                                </div>

                                {activeTab === 'upcoming' && (
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold rounded-xl"
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
                                        <Button className="w-full h-12 bg-peach-200/5 text-peach-200 hover:bg-peach-200/10 font-bold rounded-xl border border-peach-400/10">
                                            Book Again
                                        </Button>
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {!isLoading && filteredBookings.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-peach-200/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-peach-200/20" />
                    </div>
                    <h3 className="text-lg font-bold text-peach-200">No bookings found</h3>
                    <p className="text-olive-400 text-sm mb-6">
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
