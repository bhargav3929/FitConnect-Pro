"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Flame,
    Trophy,
    Calendar,
    ArrowRight,
    Dumbbell,
    Clock,
    Star,
} from "lucide-react"
import { useClientAuthStore } from "@/lib/store/clientAuthStore"
import { getUserBookings, getClassesByDate } from "@/lib/firebase/firestore"
import { Booking } from "@/types/booking"
import { ClassSession } from "@/types/class"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UserDashboard() {
    const clientUser = useClientAuthStore(state => state.clientUser)
    const firebaseUser = useClientAuthStore(state => state.firebaseUser)
    const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null)
    const [todaysClasses, setTodaysClasses] = useState<ClassSession[]>([])
    const [isLoadingBookings, setIsLoadingBookings] = useState(true)
    const [isLoadingClasses, setIsLoadingClasses] = useState(true)

    useEffect(() => {
        if (!firebaseUser) return

        getUserBookings(firebaseUser.uid).then((bookings) => {
            const upcoming = bookings.find(b => b.status === 'confirmed')
            setUpcomingBooking(upcoming || null)
            setIsLoadingBookings(false)
        }).catch(() => {
            setIsLoadingBookings(false)
        })

        getClassesByDate(new Date()).then((classes) => {
            setTodaysClasses(classes)
            setIsLoadingClasses(false)
        }).catch(() => {
            setIsLoadingClasses(false)
        })
    }, [firebaseUser])

    const formatTime = (time: string) => {
        const [h, m] = time.split(':')
        const hour = parseInt(h, 10)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour}:${m} ${ampm}`
    }

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        if (isToday) return `Today, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    // Skeleton loader while user profile loads
    if (!clientUser) {
        return (
            <div className="space-y-8 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-48 bg-peach-200/10 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-peach-200/5 rounded mt-2 animate-pulse" />
                    </div>
                    <div className="h-9 w-36 bg-peach-200/5 rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-warmDark-700 border border-peach-400/10 p-4 rounded-2xl animate-pulse">
                            <div className="h-8 w-8 bg-peach-200/5 rounded-lg mb-3" />
                            <div className="h-7 w-16 bg-peach-200/10 rounded mb-1" />
                            <div className="h-3 w-24 bg-peach-200/5 rounded" />
                        </div>
                    ))}
                </div>
                <div className="h-40 bg-peach-200/5 rounded-3xl animate-pulse" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            {/* User Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-peach-200 tracking-tight font-display">
                        Hello, {clientUser.name.split(' ')[0]}
                    </h1>
                    <p className="text-peach-400/60 text-sm mt-1">
                        Ready for your workout today?
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-terra-400/10 border border-terra-400/20 px-4 py-2 rounded-full">
                    <Flame className="w-4 h-4 text-terra-400" />
                    <span className="text-terra-300 font-bold text-sm">{clientUser.stats.currentStreak} Day Streak</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Classes Attended", value: clientUser.stats.totalClassesAttended, icon: Trophy, color: "text-terra-400" },
                    { label: "Classes Left", value: clientUser.subscription.classesRemaining, icon: Star, color: "text-terra-300" },
                    { label: "Plan", value: clientUser.subscription.planType || 'None', icon: Calendar, color: "text-olive-300" },
                    { label: "Next Goal", value: `${Math.ceil((clientUser.stats.totalClassesAttended + 1) / 10) * 10} Classes`, icon: Dumbbell, color: "text-peach-400" },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-warmDark-700 border border-peach-400/10 p-4 rounded-2xl"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg bg-peach-200/5 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-peach-200">{stat.value}</p>
                        <p className="text-xs text-peach-400/60 font-medium uppercase tracking-wider">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Upcoming Class Banner */}
            {isLoadingBookings ? (
                <div className="h-40 bg-peach-200/5 rounded-3xl animate-pulse" />
            ) : upcomingBooking ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-terra-400 to-terra-300 p-6 text-peach-50"
                >
                    <div className="absolute top-0 right-0 p-32 bg-peach-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-warmDark-900/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-3">
                                <Clock className="w-3 h-3" />
                                UPCOMING CLASS
                            </div>
                            <h2 className="text-2xl font-black mb-1">
                                {(upcomingBooking as Booking & { classType?: string }).classType || 'Pilates Class'}
                            </h2>
                            <div className="flex items-center gap-4 text-peach-50/80 text-sm font-medium">
                                <span>{formatDate(upcomingBooking.classDate)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center bg-warmDark-900/10 backdrop-blur-sm rounded-xl p-3 min-w-[80px]">
                                <p className="text-xs font-bold opacity-60 uppercase">Spot</p>
                                <p className="text-lg font-black">{upcomingBooking.spotNumber}</p>
                            </div>
                            <Link href="/user/bookings">
                                <Button className="bg-warmDark-900 text-peach-200 hover:bg-warmDark-800 font-bold px-6 h-12 rounded-xl">
                                    VIEW BOOKING
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden rounded-3xl bg-warmDark-700 border border-peach-400/10 p-6"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-peach-200/5 px-3 py-1 rounded-full text-xs font-bold text-peach-400/60 mb-3">
                                <Calendar className="w-3 h-3" />
                                NO UPCOMING CLASSES
                            </div>
                            <h2 className="text-xl font-black text-peach-200 mb-1">Book your next session</h2>
                            <p className="text-peach-400/60 text-sm">Browse the schedule and reserve your spot</p>
                        </div>
                        <Link href="/user/schedule">
                            <Button className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold px-6 h-12 rounded-xl">
                                BROWSE SCHEDULE
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Today's Schedule */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-peach-200 font-display">Today at the Studio</h2>
                    <Link href="/user/schedule" className="text-sm font-bold text-terra-400 hover:text-peach-200 transition-colors flex items-center gap-1">
                        FULL SCHEDULE <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {isLoadingClasses ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-warmDark-700 border border-peach-400/10 rounded-2xl p-4 animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center min-w-[56px]">
                                            <div className="h-5 w-12 bg-peach-200/10 rounded" />
                                            <div className="h-3 w-6 bg-peach-200/5 rounded mt-1" />
                                        </div>
                                        <div className="w-px h-10 bg-peach-200/10" />
                                        <div>
                                            <div className="h-5 w-32 bg-peach-200/10 rounded mb-1" />
                                            <div className="h-3 w-24 bg-peach-200/5 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-4 w-16 bg-peach-200/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : todaysClasses.length > 0 ? (
                    <div className="space-y-3">
                        {todaysClasses.map((cls, idx) => {
                            const spotsLeft = (cls.totalSpots || cls.capacity) - cls.bookedCount
                            return (
                                <motion.div
                                    key={cls.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + (idx * 0.1) }}
                                >
                                    <Link href="/user/schedule" className="block">
                                        <div className="bg-warmDark-700 border border-peach-400/10 rounded-2xl p-4 hover:border-terra-400/30 transition-all group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center min-w-[56px]">
                                                        <span className="text-lg font-black text-peach-200 leading-none">
                                                            {formatTime(cls.startTime).split(' ')[0]}
                                                        </span>
                                                        <span className="text-[10px] text-peach-400/60 font-bold mt-1">
                                                            {formatTime(cls.startTime).split(' ')[1]}
                                                        </span>
                                                    </div>
                                                    <div className="w-px h-10 bg-peach-200/10" />
                                                    <div>
                                                        <h3 className="text-peach-200 font-bold group-hover:text-terra-400 transition-colors">
                                                            {cls.classType || 'Pilates Class'}
                                                        </h3>
                                                        <p className="text-peach-400/60 text-xs mt-0.5">
                                                            {cls.location || 'Main Studio'} · {cls.duration} min
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    {spotsLeft <= 0 ? (
                                                        <span className="text-xs font-bold text-peach-200/20 uppercase tracking-wider">Full</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-terra-400">
                                                            {spotsLeft} spots
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-warmDark-700 border border-peach-400/10 rounded-2xl p-8 text-center">
                        <Calendar className="w-8 h-8 text-peach-200/20 mx-auto mb-3" />
                        <p className="text-peach-400/60 text-sm">No classes scheduled for today</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/user/schedule">
                    <div className="bg-warmDark-700 border border-peach-400/10 rounded-2xl p-5 hover:border-terra-400/30 transition-all group cursor-pointer">
                        <Calendar className="w-6 h-6 text-peach-400 mb-3 group-hover:text-terra-400 transition-colors" />
                        <h3 className="text-peach-200 font-bold mb-1">Book a Class</h3>
                        <p className="text-peach-400/60 text-xs">Browse the full schedule and reserve your spot</p>
                    </div>
                </Link>
                <Link href="/user/bookings">
                    <div className="bg-warmDark-700 border border-peach-400/10 rounded-2xl p-5 hover:border-terra-400/30 transition-all group cursor-pointer">
                        <Dumbbell className="w-6 h-6 text-peach-400 mb-3 group-hover:text-terra-400 transition-colors" />
                        <h3 className="text-peach-200 font-bold mb-1">My Bookings</h3>
                        <p className="text-peach-400/60 text-xs">View upcoming sessions and booking history</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
