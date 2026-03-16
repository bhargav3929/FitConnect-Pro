"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock Bookings Data
const BOOKINGS = [
    {
        id: "b1",
        className: "Morning HIIT",
        zone: "Performance Floor",
        trainer: "John Smith",
        date: "Today, Jan 6",
        time: "06:00 AM",
        duration: "45 min",
        status: "confirmed",
        image: "/gym-1.jpg"
    },
    {
        id: "b2",
        className: "Power Yoga",
        zone: "Heated Yoga Studio",
        trainer: "Sarah Chen",
        date: "Thu, Jan 8",
        time: "06:00 PM",
        duration: "60 min",
        status: "confirmed",
        image: "/gym-2.jpg"
    },
    {
        id: "b3",
        className: "Boxing Basics",
        zone: "Combat Zone",
        trainer: "Mike Johnson",
        date: "Dec 28, 2023",
        time: "10:00 AM",
        duration: "60 min",
        status: "attended",
        image: "/gym-1.jpg"
    },
    {
        id: "b4",
        className: "Spin Class",
        zone: "Cycling Theater",
        trainer: "Emily Brown",
        date: "Dec 20, 2023",
        time: "05:00 PM",
        duration: "45 min",
        status: "cancelled",
        image: "/gym-3.jpg"
    }
]

export default function BookingsPage() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

    const filteredBookings = BOOKINGS.filter(booking => {
        if (activeTab === 'upcoming') return booking.status === 'confirmed'
        return booking.status === 'attended' || booking.status === 'cancelled'
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-gold-400/20 text-gold-400'
            case 'attended': return 'bg-green-500/20 text-green-400'
            case 'cancelled': return 'bg-red-500/20 text-red-400'
            default: return 'bg-sand-200/10 text-sage-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <AlertCircle className="w-3 h-3" />
            case 'attended': return <CheckCircle2 className="w-3 h-3" />
            case 'cancelled': return <XCircle className="w-3 h-3" />
            default: return null
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-sand-200 tracking-tight font-display">My Bookings</h1>
                <p className="text-sage-500 text-sm mt-1">
                    Manage your upcoming classes and view history
                </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-sand-200/5 rounded-xl w-fit">
                {['upcoming', 'past'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                                ? 'bg-gold-400 text-forest-700 shadow-lg'
                                : 'text-sage-400 hover:text-sand-200'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Bookings Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredBookings.map((booking, idx) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-forest-800 border border-forest-600 rounded-2xl p-6 group hover:border-gold-400/30 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${getStatusColor(booking.status)}`}>
                                        {getStatusIcon(booking.status)}
                                        {booking.status}
                                    </div>
                                    <h3 className="text-xl font-bold text-sand-200 mb-1 group-hover:text-gold-400 transition-colors">
                                        {booking.className}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sage-400 text-sm">
                                        <User className="w-3 h-3" />
                                        <span>{booking.trainer}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-2xl text-sand-200">{booking.time.split(' ')[0]}</p>
                                    <p className="text-xs font-bold text-sage-500 uppercase">{booking.time.split(' ')[1]}</p>
                                </div>
                            </div>

                            <div className="bg-sand-200/5 rounded-xl p-4 space-y-3 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-sage-400">
                                        <Calendar className="w-4 h-4" />
                                        Date
                                    </span>
                                    <span className="font-medium text-sand-200">{booking.date}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-sage-400">
                                        <Clock className="w-4 h-4" />
                                        Duration
                                    </span>
                                    <span className="font-medium text-sand-200">{booking.duration}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-sage-400">
                                        <MapPin className="w-4 h-4" />
                                        Zone
                                    </span>
                                    <span className="font-medium text-sand-200">{booking.zone}</span>
                                </div>
                            </div>

                            {activeTab === 'upcoming' && (
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-12 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button className="flex-1 h-12 bg-gold-400 text-forest-700 hover:bg-gold-300 font-bold rounded-xl">
                                        Get Directions
                                    </Button>
                                </div>
                            )}

                            {activeTab === 'past' && booking.status === 'attended' && (
                                <Button className="w-full h-12 bg-sand-200/5 text-sand-200 hover:bg-sand-200/10 font-bold rounded-xl border border-forest-600">
                                    Book Again
                                </Button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredBookings.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-sand-200/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-sand-200/20" />
                    </div>
                    <h3 className="text-lg font-bold text-sand-200">No bookings found</h3>
                    <p className="text-sage-500 text-sm mb-6">
                        {activeTab === 'upcoming'
                            ? "You don't have any upcoming classes scheduled."
                            : "You haven't completed any classes yet."
                        }
                    </p>
                    {activeTab === 'upcoming' && (
                        <Link href="/user/schedule">
                            <Button className="font-bold rounded-xl px-8">
                                Browse Schedule
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
