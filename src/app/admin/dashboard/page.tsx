"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    ArrowRight,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react"
import {
    UsersThree,
    CalendarDots,
    ChartLineUp,
    Barbell,
    MapPin,
    ArrowUpRight,
    type Icon as PhosphorIcon,
} from "@phosphor-icons/react"
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
import { getBookingStats, getAllMembers, getClassesByDate, getAllBookings } from "@fitconnect/shared/firebase/firestore"
import { Booking } from "@fitconnect/shared/types/booking"
import { CHART_THEME } from "@fitconnect/shared/theme"

const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
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

                setRecentBookings(allBookings.slice(0, 5))

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
                // Dashboard will show zeros
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    const getActivityColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-terra-400'
            case 'attended': return 'bg-green-500'
            case 'canceled': return 'bg-red-500/80'
            default: return 'bg-peach-400'
        }
    }

    const getActivityIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <AlertCircle className="w-3 h-3" />
            case 'attended': return <CheckCircle2 className="w-3 h-3" />
            case 'canceled': return <XCircle className="w-3 h-3" />
            default: return <AlertCircle className="w-3 h-3" />
        }
    }

    const formatTimeAgo = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    const statItems: { label: string; value: string | number; icon: PhosphorIcon; color: string }[] = [
        { label: "Active Members", value: stats.totalMembers, icon: UsersThree, color: "text-terra-400" },
        { label: "Today's Classes", value: stats.todaysClasses, icon: Barbell, color: "text-terra-300" },
        { label: "Today's Bookings", value: stats.todayBookings, icon: CalendarDots, color: "text-olive-400" },
        { label: "Total Bookings", value: stats.totalBookings, icon: ChartLineUp, color: "text-olive-300" },
    ]

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20 lg:pb-0">

            {/* ═══════════ WELCOME BANNER ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-peach-300 via-peach-200 to-peach-100 p-6 md:p-10"
            >
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-terra-400/5" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-olive-400/5" />

                <div className="relative z-10">
                    {/* Greeting + Date */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <p className="text-olive-300 text-sm font-medium tracking-wide">{getGreeting()}, Admin</p>
                            <h1 className="app-hero-title mt-1">
                                Studio Dashboard
                            </h1>
                        </div>
                        <span className="text-olive-300/60 text-xs font-mono bg-peach-50/50 px-3 py-1.5 rounded-full border border-peach-400/15 w-fit">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                    </div>

                    {/* Stats Row — inside the banner */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                        {statItems.map((stat, idx) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                className="bg-peach-50/60 backdrop-blur-sm rounded-xl p-4 border border-peach-400/10"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <stat.icon weight="duotone" className={`w-4 h-4 ${stat.color}`} />
                                    <p className="app-stat-label">{stat.label}</p>
                                </div>
                                {isLoading ? (
                                    <div className="h-8 w-16 bg-peach-300/30 rounded animate-pulse" />
                                ) : (
                                    <p className="app-stat-value md:text-3xl">
                                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ═══════════ CHART + ACTIVITY ═══════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Weekly Attendance Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="xl:col-span-2 bg-peach-50 border border-peach-400/15 rounded-2xl p-6 md:p-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="app-card-title">Weekly Attendance</h3>
                            <p className="text-olive-300 text-xs mt-0.5">Classes attended this week</p>
                        </div>
                        <Link href="/admin/reports" className="text-xs font-bold text-terra-400 hover:text-terra-300 transition-colors flex items-center gap-1 tracking-wider">
                            REPORTS <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <div className="h-[260px] md:h-[300px] w-full">
                        {isLoading ? (
                            <div className="h-full flex items-end gap-4 px-4">
                                {[40, 60, 30, 80, 50, 70, 45].map((h, i) => (
                                    <div key={i} className="flex-1 bg-peach-300/30 rounded-t-lg animate-pulse" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridLine} vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke={CHART_THEME.axisStrokeMuted}
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={8}
                                    />
                                    <YAxis
                                        stroke={CHART_THEME.axisStrokeMuted}
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-8}
                                    />
                                    <Tooltip
                                        cursor={{ fill: CHART_THEME.cursorFill }}
                                        contentStyle={{
                                            backgroundColor: CHART_THEME.tooltipBg,
                                            border: `1px solid ${CHART_THEME.tooltipBorderLight}`,
                                            borderRadius: '12px',
                                            boxShadow: CHART_THEME.tooltipShadowSm,
                                            padding: '10px 14px',
                                            fontSize: '12px',
                                        }}
                                        itemStyle={{ color: CHART_THEME.itemText }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill={CHART_THEME.bar}
                                        radius={[6, 6, 6, 6]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-peach-50 border border-peach-400/15 rounded-2xl p-6 md:p-8 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="app-card-title">Recent Activity</h3>
                        <Link href="/admin/bookings" className="text-xs font-bold text-terra-400 hover:text-terra-300 transition-colors tracking-wider">
                            ALL
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="space-y-5 flex-1">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-peach-300/30" />
                                    <div className="flex-1">
                                        <div className="h-3.5 w-32 bg-peach-300/30 rounded mb-1.5" />
                                        <div className="h-2.5 w-20 bg-peach-200/40 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentBookings.length > 0 ? (
                        <div className="space-y-4 flex-1">
                            {recentBookings.map((booking, index) => (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 + (index * 0.06) }}
                                    className="flex items-center gap-3"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-peach-50 ${getActivityColor(booking.status)}`}>
                                        {getActivityIcon(booking.status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-olive-600 font-medium truncate">
                                            Spot {booking.spotNumber} <span className="text-olive-300 capitalize">· {booking.status}</span>
                                        </p>
                                        <p className="text-[11px] text-olive-300 flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {formatTimeAgo(booking.bookingDate)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-olive-300 text-sm">No recent activity</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ═══════════ QUICK ACTIONS — ASYMMETRIC ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {/* Primary — spans 2 cols */}
                <Link href="/admin/classes" className="md:col-span-2 group">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-olive-600 to-olive-400 p-6 md:p-8 h-full transition-all hover:shadow-lg hover:shadow-olive-600/15">
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-peach-200/10" />
                        <div className="absolute top-5 right-5">
                            <div className="w-10 h-10 rounded-full bg-peach-200/10 flex items-center justify-center group-hover:bg-peach-200/20 transition-colors">
                                <ArrowUpRight weight="bold" className="w-5 h-5 text-peach-200/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </div>
                        <CalendarDots weight="duotone" className="w-7 h-7 text-peach-200/50 mb-4" />
                        <h3 className="text-peach-50 font-bold text-lg">Manage Classes</h3>
                        <p className="text-peach-200/50 text-sm mt-1 max-w-sm">
                            Add new sessions, update schedules, and manage trainer assignments.
                        </p>
                    </div>
                </Link>

                {/* Secondary actions stacked */}
                <div className="flex flex-col gap-4">
                    <Link href="/admin/members" className="group flex-1">
                        <div className="rounded-2xl border border-peach-400/15 bg-peach-50 p-5 h-full hover:border-terra-400/25 transition-all flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-terra-400/8 flex items-center justify-center flex-shrink-0 group-hover:bg-terra-400/15 transition-colors">
                                <UsersThree weight="duotone" className="w-5 h-5 text-terra-400" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-olive-600 font-bold text-sm">Members</h4>
                                <p className="text-olive-300 text-xs truncate">View & manage</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/admin/locations" className="group flex-1">
                        <div className="rounded-2xl border border-peach-400/15 bg-peach-50 p-5 h-full hover:border-terra-400/25 transition-all flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-olive-400/8 flex items-center justify-center flex-shrink-0 group-hover:bg-olive-400/15 transition-colors">
                                <MapPin weight="duotone" className="w-5 h-5 text-olive-400" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-olive-600 font-bold text-sm">Facility</h4>
                                <p className="text-olive-300 text-xs truncate">Studio settings</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
