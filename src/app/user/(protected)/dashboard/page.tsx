"use client"

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
import Link from "next/link"
import { Button } from "@/components/ui/button"

const UPCOMING_CLASS = {
    name: "HIIT Intensity",
    location: "Performance Floor",
    time: "Today, 6:00 PM",
    duration: "45 min",
    spot: "Spot 12"
}

const TODAYS_CLASSES = [
    { id: "1", name: "Strength & Sculpt", time: "06:00 AM", trainer: "Melinda H", location: "Performance Floor", spotsLeft: 0 },
    { id: "2", name: "Morning Flow", time: "07:30 AM", trainer: "Sarah C", location: "Heated Yoga Studio", spotsLeft: 5 },
    { id: "3", name: "Power Cycling", time: "09:00 AM", trainer: "David R", location: "Cycling Theater", spotsLeft: 7 },
]

export default function UserDashboard() {
    const user = useClientAuthStore(state => state.clientUser)

    if (!user) return null

    return (
        <div className="space-y-8 pb-20">
            {/* User Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-sand-200 tracking-tight font-display">
                        Hello, {user.name.split(' ')[0]}
                    </h1>
                    <p className="text-sage-500 text-sm mt-1">
                        Ready for your workout today?
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 px-4 py-2 rounded-full">
                    <Flame className="w-4 h-4 text-gold-400" />
                    <span className="text-gold-400 font-bold text-sm">{user.stats.streak} Day Streak</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Classes Attended", value: user.stats.classesAttended, icon: Trophy, color: "text-gold-400" },
                    { label: "Loyalty Points", value: user.stats.points, icon: Star, color: "text-terracotta-400" },
                    { label: "Membership", value: user.membership.type, icon: Calendar, color: "text-sage-300" },
                    { label: "Next Goal", value: "20 Classes", icon: Dumbbell, color: "text-gold-300" },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-forest-800 border border-forest-600 p-4 rounded-2xl"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg bg-sand-200/5 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-sand-200">{stat.value}</p>
                        <p className="text-xs text-sage-500 font-medium uppercase tracking-wider">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Upcoming Class Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gold-400 to-gold-500 p-6 text-forest-700"
            >
                <div className="absolute top-0 right-0 p-32 bg-sand-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-forest-700/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-3">
                            <Clock className="w-3 h-3" />
                            UPCOMING CLASS
                        </div>
                        <h2 className="text-2xl font-black mb-1">{UPCOMING_CLASS.name}</h2>
                        <div className="flex items-center gap-4 text-forest-700/80 text-sm font-medium">
                            <span className="flex items-center gap-1">
                                <Dumbbell className="w-4 h-4" />
                                {UPCOMING_CLASS.location}
                            </span>
                            <span className="w-1 h-1 bg-forest-700/40 rounded-full" />
                            <span>{UPCOMING_CLASS.time}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-center bg-forest-700/10 backdrop-blur-sm rounded-xl p-3 min-w-[80px]">
                            <p className="text-xs font-bold opacity-60 uppercase">Duration</p>
                            <p className="text-lg font-black">{UPCOMING_CLASS.duration}</p>
                        </div>
                        <Button className="bg-forest-700 text-sand-200 hover:bg-forest-800 font-bold px-6 h-12 rounded-xl">
                            CHECK IN
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Today's Schedule */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-sand-200 font-display">Today at the Facility</h2>
                    <Link href="/user/schedule" className="text-sm font-bold text-gold-400 hover:text-sand-200 transition-colors flex items-center gap-1">
                        FULL SCHEDULE <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="space-y-3">
                    {TODAYS_CLASSES.map((cls, idx) => (
                        <motion.div
                            key={cls.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (idx * 0.1) }}
                        >
                            <Link href="/user/schedule" className="block">
                                <div className="bg-forest-800 border border-forest-600 rounded-2xl p-4 hover:border-gold-400/30 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center min-w-[56px]">
                                                <span className="text-lg font-black text-sand-200 leading-none">{cls.time.split(' ')[0]}</span>
                                                <span className="text-[10px] text-sage-500 font-bold mt-1">{cls.time.split(' ')[1]}</span>
                                            </div>
                                            <div className="w-px h-10 bg-sand-200/10" />
                                            <div>
                                                <h3 className="text-sand-200 font-bold group-hover:text-gold-400 transition-colors">{cls.name}</h3>
                                                <p className="text-sage-500 text-xs mt-0.5">
                                                    {cls.trainer} · {cls.location}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            {cls.spotsLeft === 0 ? (
                                                <span className="text-xs font-bold text-sand-200/20 uppercase tracking-wider">Full</span>
                                            ) : (
                                                <span className="text-xs font-bold text-gold-400">
                                                    {cls.spotsLeft} spots
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/user/schedule">
                    <div className="bg-forest-800 border border-forest-600 rounded-2xl p-5 hover:border-gold-400/30 transition-all group cursor-pointer">
                        <Calendar className="w-6 h-6 text-sage-400 mb-3 group-hover:text-gold-400 transition-colors" />
                        <h3 className="text-sand-200 font-bold mb-1">Book a Class</h3>
                        <p className="text-sage-500 text-xs">Browse the full schedule and reserve your spot</p>
                    </div>
                </Link>
                <Link href="/user/bookings">
                    <div className="bg-forest-800 border border-forest-600 rounded-2xl p-5 hover:border-gold-400/30 transition-all group cursor-pointer">
                        <Dumbbell className="w-6 h-6 text-sage-400 mb-3 group-hover:text-gold-400 transition-colors" />
                        <h3 className="text-sand-200 font-bold mb-1">My Bookings</h3>
                        <p className="text-sage-500 text-xs">View upcoming sessions and booking history</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
