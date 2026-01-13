"use client"

import { motion } from "framer-motion"
import {
    Users,
    CalendarDays,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    Clock,
    MoreHorizontal,
    Dumbbell,
    MapPin
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts"
import Link from "next/link"

// Mock data for charts
const revenueData = [
    { name: "Jan", value: 4200 },
    { name: "Feb", value: 3800 },
    { name: "Mar", value: 5100 },
    { name: "Apr", value: 4800 },
    { name: "May", value: 6400 },
    { name: "Jun", value: 5900 },
    { name: "Jul", value: 7200 },
]

const attendanceData = [
    { name: "Mon", value: 45 },
    { name: "Tue", value: 52 },
    { name: "Wed", value: 48 },
    { name: "Thu", value: 65 },
    { name: "Fri", value: 58 },
    { name: "Sat", value: 75 },
    { name: "Sun", value: 42 },
]

// Mock recent activities
const recentActivities = [
    { id: 1, type: "booking", message: "John Doe booked HIIT Class", time: "2 min ago", status: "success", avatar: "JD" },
    { id: 2, type: "member", message: "New member Sarah Chen joined", time: "15 min ago", status: "success", avatar: "SC" },
    { id: 3, type: "class", message: "Yoga Session was completed", time: "1 hour ago", status: "success", avatar: "YS" },
    { id: 4, type: "booking", message: "Mike Wilson cancelled booking", time: "2 hours ago", status: "canceled", avatar: "MW" },
    { id: 5, type: "trainer", message: "Trainer James updated schedule", time: "3 hours ago", status: "success", avatar: "TJ" },
]

// Animated Stat Card
function StatCard({
    title,
    value,
    change,
    icon: Icon,
    delay = 0
}: {
    title: string
    value: string
    change: string
    icon: any
    delay?: number
}) {
    const isPositive = change.startsWith('+')

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className="group relative overflow-hidden bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-3xl hover:border-white/20 transition-all duration-500 hover:bg-white/5"
        >
            {/* Gradient Background Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7BA3A8]/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 duration-500" />

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#7BA3A8]/20 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-6 h-6 text-white/60 group-hover:text-[#7BA3A8] transition-colors" />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 border ${isPositive
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {change}
                    <TrendingUp className={`w-3 h-3 ${!isPositive && 'rotate-180'}`} />
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                    {value}
                </h3>
                <p className="text-white/40 text-xs font-semibold tracking-[0.2em] uppercase">
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
    icon: any
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
                className="flex flex-col p-6 bg-[#0A0A0A] border border-white/10 rounded-3xl hover:bg-white/5 hover:border-white/20 transition-all group relative overflow-hidden h-full"
            >
                <div className="absolute top-4 right-4 text-white/20 group-hover:text-white transition-colors">
                    <ArrowUpRight className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                    <Icon className="w-6 h-6 text-white/70" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-[#7BA3A8] transition-colors">{label}</h4>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
            </Link>
        </motion.div>
    )
}

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20 lg:pb-0">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5"
            >
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                        Dashboard
                    </h2>
                    <p className="text-white/40 text-sm md:text-base tracking-wide max-w-lg">
                        Overview of your fitness center performance, member activity, and daily operations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-white/20 text-xs font-mono bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                <StatCard
                    title="Active Members"
                    value="2,847"
                    change="+12.5%"
                    icon={Users}
                    delay={0}
                />
                <StatCard
                    title="Today's Classes"
                    value="24"
                    change="+3"
                    icon={Dumbbell}
                    delay={0.1}
                />
                <StatCard
                    title="Revenue (Mo)"
                    value="$48.2k"
                    change="+8.2%"
                    icon={DollarSign}
                    delay={0.2}
                />
                <StatCard
                    title="New Leads"
                    value="186"
                    change="+24.1%"
                    icon={TrendingUp}
                    delay={0.3}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="xl:col-span-2 bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-3xl"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Financial Performance</h3>
                            <p className="text-white/40 text-xs tracking-wider uppercase">Revenue vs Previous Period</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors">7D</button>
                            <button className="px-3 py-1 rounded-lg bg-transparent text-white/40 text-xs font-medium hover:text-white transition-colors">1M</button>
                            <button className="px-3 py-1 rounded-lg bg-transparent text-white/40 text-xs font-medium hover:text-white transition-colors">1Y</button>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7BA3A8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#7BA3A8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
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
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                    contentStyle={{
                                        backgroundColor: '#0A0A0A',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value) => [`$${value ?? 0}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#7BA3A8"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Quick Actions Grid */}
                <div className="bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-3xl flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 flex-1">
                        <QuickAction
                            label="Add Class"
                            desc="Schedule a new session"
                            href="/admin/classes"
                            icon={CalendarDays}
                            delay={0.5}
                        />
                        <QuickAction
                            label="New Member"
                            desc="Register a signup"
                            href="/admin/members"
                            icon={Users}
                            delay={0.6}
                        />
                        <QuickAction
                            label="Add Location"
                            desc="Expand your network"
                            href="/admin/locations"
                            icon={MapPin}
                            delay={0.7}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Activity & Attendance */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="xl:col-span-1 bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-3xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                        <Link
                            href="/admin/bookings"
                            className="text-[#7BA3A8] text-xs font-bold tracking-widest hover:text-white transition-colors uppercase"
                        >
                            View All
                        </Link>
                    </div>
                    <div className="space-y-6 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/5" />

                        {recentActivities.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + (index * 0.1) }}
                                className="flex items-start gap-4 relative"
                            >
                                <div className={`relative z-10 w-10 h-10 rounded-full border-4 border-[#0A0A0A] flex items-center justify-center shrink-0 ${activity.status === 'success' ? 'bg-[#7BA3A8]' : 'bg-red-500/80'
                                    }`}>
                                    <span className="text-[10px] font-bold text-black">{activity.avatar}</span>
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-white">{activity.message}</p>
                                    </div>
                                    <p className="text-xs text-white/40 mt-1 flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {activity.time}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Attendance Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="xl:col-span-2 bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-3xl"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-white">Weekly Attendance</h3>
                        <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceData} barSize={40}>
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
                                        backgroundColor: '#0A0A0A',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#7BA3A8"
                                    radius={[8, 8, 8, 8]}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
