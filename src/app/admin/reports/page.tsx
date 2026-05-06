"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Users,
    Calendar,
    Activity,
    BookOpen,
    type LucideIcon,
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import {
    getAttendanceStats,
    getMembershipDistribution,
    getClassPopularity,
    getLocationUtilization,
    getAllBookings,
    type MembershipDistribution,
    type ClassPopularityItem,
    type LocationUtilization as LocationUtilizationItem,
    type AttendanceStats,
} from "@fitconnect/shared/firebase/firestore"
import { Booking } from "@fitconnect/shared/types/booking"
import { CHART_THEME } from "@fitconnect/shared/theme"

function MetricCard({ label, value, subValue, icon: Icon, delay = 0, isLoading }: {
    label: string; value: string; subValue?: string; icon: LucideIcon; delay?: number; isLoading: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            className="group relative overflow-hidden bg-peach-50 border border-peach-400/20 p-6 hover:border-terra-400/30 transition-all duration-500 hover:shadow-md"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-terra-400/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 duration-500 transition-opacity" />
            <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="w-11 h-11 bg-peach-200/60 flex items-center justify-center group-hover:bg-terra-400/15 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-5 h-5 text-olive-400 group-hover:text-terra-400 transition-colors" />
                </div>
                {subValue && (
                    <span className="text-xs font-bold text-olive-300 bg-peach-200/40 px-2 py-0.5 rounded-full">
                        {subValue}
                    </span>
                )}
            </div>
            <div className="relative z-10">
                {isLoading ? (
                    <div className="h-8 w-24 bg-peach-300/40 rounded animate-pulse mb-1" />
                ) : (
                    <p className="text-3xl font-black text-olive-600 tracking-tight group-hover:translate-x-1 transition-transform duration-300">{value}</p>
                )}
                <p className="text-[11px] text-olive-300 tracking-[0.15em] uppercase font-semibold mt-1.5">{label}</p>
            </div>
        </motion.div>
    )
}

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState<AttendanceStats | null>(null)
    const [membershipData, setMembershipData] = useState<MembershipDistribution[]>([])
    const [classPopularity, setClassPopularity] = useState<ClassPopularityItem[]>([])
    const [locationUtilization, setLocationUtilization] = useState<LocationUtilizationItem[]>([])
    const [weeklyAttendance, setWeeklyAttendance] = useState<{ name: string; value: number }[]>([])

    useEffect(() => {
        async function loadData() {
            try {
                const [attendanceData, membershipDist, classPop, locationUtil, allBookings] = await Promise.all([
                    getAttendanceStats(),
                    getMembershipDistribution(),
                    getClassPopularity(),
                    getLocationUtilization(),
                    getAllBookings(),
                ])
                setStats(attendanceData)
                setMembershipData(membershipDist.filter(d => d.value > 0))
                setClassPopularity(classPop)
                setLocationUtilization(locationUtil)

                // Compute weekly attendance pattern from bookings
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const dayCounts = new Array(7).fill(0)
                const now = new Date()
                const monthAgo = new Date(now)
                monthAgo.setDate(monthAgo.getDate() - 30)

                allBookings.forEach((b: Booking) => {
                    if (b.status === 'attended') {
                        const d = b.classDate instanceof Date ? b.classDate : new Date(b.classDate)
                        if (d >= monthAgo && d <= now) {
                            dayCounts[d.getDay()]++
                        }
                    }
                })
                setWeeklyAttendance(days.map((name, i) => ({ name, value: dayCounts[i] })))
            } catch {
                // Show empty state
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20 lg:pb-0">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-peach-400/20"
            >
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-tight mb-2 font-display">Reports</h2>
                    <p className="text-olive-300 text-sm md:text-base tracking-wide max-w-lg">Business performance insights, attendance trends, and membership analytics.</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Attended" value={(stats?.totalAttended ?? 0).toLocaleString()} icon={BookOpen} delay={0.1} isLoading={isLoading} />
                <MetricCard label="Active Members" value={(stats?.activeMembers ?? 0).toLocaleString()} icon={Users} delay={0.15} isLoading={isLoading} />
                <MetricCard label="Classes This Month" value={(stats?.thisMonthClasses ?? 0).toLocaleString()} icon={Calendar} delay={0.2} isLoading={isLoading} />
                <MetricCard label="Attendance Rate" value={`${stats?.avgAttendanceRate ?? 0}%`} subValue={`${stats?.totalClasses ?? 0} total classes`} icon={Activity} delay={0.25} isLoading={isLoading} />
            </div>

            {/* Weekly Attendance Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-olive-600 mb-1">Weekly Attendance Pattern</h3>
                        <p className="text-olive-300 text-xs tracking-wider uppercase">Classes attended by day of week (last 30 days)</p>
                    </div>
                </div>
                <div className="h-80">
                    {isLoading ? (
                        <div className="h-full flex items-end gap-4 px-4">
                            {[40, 60, 30, 80, 50, 70, 45].map((h, i) => (
                                <div key={i} className="flex-1 bg-peach-300/30 rounded-t-lg animate-pulse" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyAttendance} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridLine} vertical={false} />
                                <XAxis dataKey="name" stroke={CHART_THEME.axisStroke} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke={CHART_THEME.axisStroke} fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: CHART_THEME.cursorFill }}
                                    contentStyle={{
                                        backgroundColor: CHART_THEME.tooltipBg,
                                        border: `1px solid ${CHART_THEME.tooltipBorder}`,
                                        borderRadius: '0',
                                        boxShadow: CHART_THEME.tooltipShadow,
                                        padding: '12px',
                                        fontSize: '12px',
                                    }}
                                />
                                <Bar dataKey="value" fill={CHART_THEME.bar} radius={[4, 4, 4, 4]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Membership Distribution */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-olive-600 mb-1">Membership Distribution</h3>
                        <p className="text-olive-300 text-xs tracking-wider uppercase">Active plan breakdown by type</p>
                    </div>
                    <div className="h-64 flex items-center justify-center">
                        {isLoading ? (
                            <div className="w-40 h-40 rounded-full bg-peach-300/30 animate-pulse" />
                        ) : membershipData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    <Pie data={membershipData as any[]} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                        {membershipData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: '0', boxShadow: CHART_THEME.tooltipShadow, padding: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-olive-300 text-sm">No active memberships</p>
                        )}
                    </div>
                    {membershipData.length > 0 && (
                        <div className="flex justify-center gap-6 mt-4">
                            {membershipData.map(item => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs text-olive-300 font-medium">{item.name}</span>
                                    <span className="text-xs text-olive-400 font-bold">({item.value})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Class Popularity */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-olive-600 mb-1">Class Popularity</h3>
                        <p className="text-olive-300 text-xs tracking-wider uppercase">Bookings by class type</p>
                    </div>
                    <div className="h-64">
                        {isLoading ? (
                            <div className="space-y-4 pt-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-4 animate-pulse">
                                        <div className="h-3 w-16 bg-peach-300/30 rounded" />
                                        <div className="flex-1 h-4 bg-peach-200/50 rounded" style={{ width: `${90 - i * 15}%` }} />
                                    </div>
                                ))}
                            </div>
                        ) : classPopularity.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classPopularity} layout="vertical" barSize={16}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridLine} horizontal={false} />
                                    <XAxis type="number" stroke={CHART_THEME.axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="name" type="category" stroke={CHART_THEME.axisStroke} fontSize={12} tickLine={false} axisLine={false} width={90} />
                                    <Tooltip cursor={{ fill: CHART_THEME.cursorFillMuted }} contentStyle={{ backgroundColor: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: '0', boxShadow: CHART_THEME.tooltipShadow, padding: '12px' }} />
                                    <Bar dataKey="bookings" fill={CHART_THEME.bar} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-olive-300 text-sm">No booking data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Location Utilization */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-olive-600 mb-1">Location Utilization</h3>
                    <p className="text-olive-300 text-xs tracking-wider uppercase">Space usage across studio rooms</p>
                </div>
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between py-4 animate-pulse">
                                <div className="h-4 w-40 bg-peach-300/30 rounded" />
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-2 bg-peach-200/50 rounded-full" />
                                    <div className="h-4 w-10 bg-peach-200/50 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : locationUtilization.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-peach-400/15">
                                    <th className="text-left text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase pb-4">Location</th>
                                    <th className="text-right text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase pb-4">Bookings</th>
                                    <th className="text-right text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase pb-4 w-48">Utilization</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locationUtilization.map((loc, idx) => (
                                    <motion.tr key={loc.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 + idx * 0.05 }} className="border-b border-peach-400/8 hover:bg-peach-100/50 transition-colors group">
                                        <td className="py-4 font-medium text-olive-600 group-hover:text-terra-500 transition-colors">{loc.name}</td>
                                        <td className="py-4 text-right text-olive-400 font-medium">{loc.bookings.toLocaleString()}</td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="w-24 h-2 bg-peach-300/30 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${loc.utilization}%` }} transition={{ delay: 0.7 + idx * 0.1, duration: 0.8, ease: "easeOut" }} className={`h-full rounded-full ${loc.utilization >= 85 ? 'bg-terra-400' : 'bg-olive-400/60'}`} />
                                                </div>
                                                <span className="text-olive-400 text-sm font-bold w-10 text-right">{loc.utilization}%</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-olive-300 text-sm">No location data available</p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
