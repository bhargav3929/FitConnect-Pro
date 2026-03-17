"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Users,
    CalendarDays,
    TrendingUp,
    ArrowUpRight,
    Clock,
    MoreHorizontal,
    Dumbbell,
    MapPin,
    type LucideIcon,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import Link from "next/link"
import { getBookingStats, getAllMembers, getClassesByDate, getAllBookings } from "@/lib/firebase/firestore"
import { Booking } from "@/types/booking"

// Animated Stat Card
function StatCard({
    title,
    value,
    icon: Icon,
    delay = 0,
    isLoading = false,
}: {
    title: string
    value: string
    icon: LucideIcon
    delay?: number
    isLoading?: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className="group relative overflow-hidden bg-forest-800 border border-forest-600 p-6 sm:p-8 rounded-3xl hover:border-gold-400/30 transition-all duration-500 hover:bg-sand-200/5"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 duration-500" />

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-12 h-12 bg-sand-200/5 rounded-2xl flex items-center justify-center group-hover:bg-gold-400/20 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-6 h-6 text-sage-400 group-hover:text-gold-400 transition-colors" />
                </div>
            </div>

            <div className="relative z-10">
                {isLoading ? (
                    <div className="h-9 w-20 bg-sand-200/10 rounded animate-pulse mb-2" />
                ) : (
                    <h3 className="text-3xl sm:text-4xl font-black text-sand-200 mb-2 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                        {value}
                    </h3>
                )}
                <p className="text-sage-500 text-xs font-semibold tracking-[0.2em] uppercase">
                    {title}
                </p>
            </div>
        </motion.div>
    )
}

// Quick Action Card
function QuickAction({
    label,
    desc,
    href,
    icon: Icon,
    delay = 0
}: {
    label: string
    desc: string
    href: string
    icon: LucideIcon
    delay: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
        >
            <Link
                href={href}
                className="flex flex-col p-6 bg-forest-800 border border-forest-600 rounded-3xl hover:bg-sand-200/5 hover:border-gold-400/30 transition-all group relative overflow-hidden h-full"
            >
                <div className="absolute top-4 right-4 text-sand-200/20 group-hover:text-sand-200 transition-colors">
                    <ArrowUpRight className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 bg-sand-200/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-sand-200/10 transition-colors">
                    <Icon className="w-6 h-6 text-sand-200/70" />
                </div>
                <h4 className="text-lg font-bold text-sand-200 mb-1 group-hover:text-gold-400 transition-colors">{label}</h4>
                <p className="text-sage-500 text-xs leading-relaxed">{desc}</p>
            </Link>
        </motion.div>
    )
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalMembers: 0,
        todaysClasses: 0,
        todayBookings: 0,
        totalBookings: 0,
    })
    const [recentBookings, setRecentBookings] = useState<Booking[]>([])
    const [weeklyData, setWeeklyData] = useState<{ name: string; value: number }[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const [bookingStats, members, todaysClasses, allBookings] = await Promise.all([
                    getBookingStats(),
                    getAllMembers(),
                    getClassesByDate(new Date()),
                    getAllBookings(),
                ])

                setStats({
                    totalMembers: members.length,
                    todaysClasses: todaysClasses.length,
                    todayBookings: bookingStats.todayBookings,
                    totalBookings: bookingStats.totalBookings,
                })

                // Recent bookings (last 5)
                setRecentBookings(allBookings.slice(0, 5))

                // Build weekly attendance from bookings
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const dayCounts = new Array(7).fill(0)
                const now = new Date()
                const weekAgo = new Date(now)
                weekAgo.setDate(weekAgo.getDate() - 7)

                allBookings.forEach((b) => {
                    const d = b.classDate instanceof Date ? b.classDate : new Date(b.classDate)
                    if (d >= weekAgo && d <= now && b.status === 'attended') {
                        dayCounts[d.getDay()]++
                    }
                })

                setWeeklyData(days.map((name, i) => ({ name, value: dayCounts[i] })))
            } catch {
                // Silently handle — dashboard will show zeros
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    const getActivityIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <AlertCircle className="w-3 h-3" />
            case 'attended': return <CheckCircle2 className="w-3 h-3" />
            case 'canceled': return <XCircle className="w-3 h-3" />
            default: return <AlertCircle className="w-3 h-3" />
        }
    }

    const getActivityColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-gold-400'
            case 'attended': return 'bg-green-500'
            case 'canceled': return 'bg-red-500/80'
            default: return 'bg-sage-400'
        }
    }

    const formatTimeAgo = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins} min ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20 lg:pb-0">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-forest-600/50"
            >
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-sand-200 tracking-tight mb-2 font-display">
                        Dashboard
                    </h2>
                    <p className="text-sage-500 text-sm md:text-base tracking-wide max-w-lg">
                        Your studio performance, member activity, and daily operations at a glance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sand-200/20 text-xs font-mono bg-sand-200/5 px-3 py-1 rounded-full border border-forest-600/50">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                <StatCard
                    title="Active Members"
                    value={stats.totalMembers.toLocaleString()}
                    icon={Users}
                    delay={0}
                    isLoading={isLoading}
                />
                <StatCard
                    title="Today's Classes"
                    value={String(stats.todaysClasses)}
                    icon={Dumbbell}
                    delay={0.1}
                    isLoading={isLoading}
                />
                <StatCard
                    title="Today's Bookings"
                    value={String(stats.todayBookings)}
                    icon={CalendarDays}
                    delay={0.2}
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings.toLocaleString()}
                    icon={TrendingUp}
                    delay={0.3}
                    isLoading={isLoading}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Weekly Attendance Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="xl:col-span-2 bg-forest-800 border border-forest-600 p-6 sm:p-8 rounded-3xl"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-sand-200 mb-1">Weekly Attendance</h3>
                            <p className="text-sage-500 text-xs tracking-wider uppercase">Classes attended this week</p>
                        </div>
                        <button className="flex items-center gap-2 text-sage-500 hover:text-sand-200 transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-[300px] w-full">
                        {isLoading ? (
                            <div className="h-full flex items-end gap-4 px-4">
                                {[40, 60, 30, 80, 50, 70, 45].map((h, i) => (
                                    <div key={i} className="flex-1 bg-sand-200/5 rounded-t animate-pulse" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="rgba(255,255,255,0.2)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.2)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{
                                            backgroundColor: '#222B1E',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ color: '#EDE6DA' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#D4A24C"
                                        radius={[8, 8, 8, 8]}
                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions Grid */}
                <div className="bg-forest-800 border border-forest-600 p-6 sm:p-8 rounded-3xl flex flex-col">
                    <h3 className="text-xl font-bold text-sand-200 mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 flex-1">
                        <QuickAction
                            label="Add Class"
                            desc="Schedule a new session"
                            href="/admin/classes"
                            icon={CalendarDays}
                            delay={0.5}
                        />
                        <QuickAction
                            label="Members"
                            desc="View all members"
                            href="/admin/members"
                            icon={Users}
                            delay={0.6}
                        />
                        <QuickAction
                            label="Facility Settings"
                            desc="Manage studio details"
                            href="/admin/locations"
                            icon={MapPin}
                            delay={0.7}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-forest-800 border border-forest-600 p-6 sm:p-8 rounded-3xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-sand-200">Recent Bookings</h3>
                    <Link
                        href="/admin/bookings"
                        className="text-gold-400 text-xs font-bold tracking-widest hover:text-sand-200 transition-colors uppercase"
                    >
                        View All
                    </Link>
                </div>

                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-start gap-4 animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-sand-200/5" />
                                <div className="flex-1">
                                    <div className="h-4 w-48 bg-sand-200/10 rounded mb-2" />
                                    <div className="h-3 w-24 bg-sand-200/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentBookings.length > 0 ? (
                    <div className="space-y-6 relative">
                        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-sand-200/5" />
                        {recentBookings.map((booking, index) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + (index * 0.1) }}
                                className="flex items-start gap-4 relative"
                            >
                                <div className={`relative z-10 w-10 h-10 rounded-full border-4 border-forest-800 flex items-center justify-center shrink-0 ${getActivityColor(booking.status)}`}>
                                    <span className="text-forest-700">
                                        {getActivityIcon(booking.status)}
                                    </span>
                                </div>
                                <div className="flex-1 pt-1">
                                    <p className="text-sm font-medium text-sand-200">
                                        Booking <span className="text-sage-400 capitalize">{booking.status}</span> — Spot {booking.spotNumber}
                                    </p>
                                    <p className="text-xs text-sage-500 mt-1 flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {formatTimeAgo(booking.bookingDate)}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sage-500 text-sm">No recent bookings</p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
