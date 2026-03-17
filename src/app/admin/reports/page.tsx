"use client"

import { motion } from "framer-motion"
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Calendar,
    Activity,
    ArrowUpRight,
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
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts"

// Mock data
const revenueData = [
    { name: "Jan", revenue: 45000, target: 40000 },
    { name: "Feb", revenue: 52000, target: 45000 },
    { name: "Mar", revenue: 48000, target: 50000 },
    { name: "Apr", revenue: 61000, target: 55000 },
    { name: "May", revenue: 55000, target: 60000 },
    { name: "Jun", revenue: 67000, target: 65000 },
    { name: "Jul", revenue: 72000, target: 70000 },
]

const membershipData = [
    { name: "Weekly", value: 320, color: "#8B3F2C" },
    { name: "Monthly", value: 1850, color: "#6B7752" },
    { name: "Quarterly", value: 677, color: "#D4B494" },
]

const attendanceData = [
    { name: "Week 1", value: 420 },
    { name: "Week 2", value: 380 },
    { name: "Week 3", value: 450 },
    { name: "Week 4", value: 520 },
]

const classPopularity = [
    { name: "HIIT", bookings: 856 },
    { name: "Yoga", bookings: 742 },
    { name: "Strength", bookings: 698 },
    { name: "Spin", bookings: 612 },
    { name: "Boxing", bookings: 534 },
    { name: "Pilates", bookings: 489 },
]

const topZones = [
    { name: "Performance Floor", bookings: 856, utilization: 92 },
    { name: "Heated Yoga Studio", bookings: 742, utilization: 88 },
    { name: "Cycling Theater", bookings: 612, utilization: 78 },
    { name: "Combat Zone", bookings: 534, utilization: 71 },
]

export default function ReportsPage() {
    return (
        <div className="space-y-8 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-olive-600 font-display">Reports & Analytics</h2>
                    <p className="text-olive-300 text-sm mt-1">
                        Business performance insights and trends
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="h-10 px-4 bg-peach-50 border border-peach-400/20 text-olive-400 text-sm focus:border-terra-400 focus:outline-none appearance-none cursor-pointer">
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>This Year</option>
                    </select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Revenue", value: "$72,450", change: "+12.5%", icon: DollarSign, positive: true },
                    { label: "Active Members", value: "2,847", change: "+8.2%", icon: Users, positive: true },
                    { label: "Classes This Month", value: "342", change: "+15.3%", icon: Calendar, positive: true },
                    { label: "Avg. Attendance", value: "78%", change: "-2.1%", icon: Activity, positive: false },
                ].map((metric, idx) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-peach-50 border border-peach-400/20 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center">
                                <metric.icon className="w-5 h-5 text-olive-400" />
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-bold ${metric.positive ? 'text-green-600' : 'text-red-500'
                                }`}>
                                {metric.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {metric.change}
                            </span>
                        </div>
                        <p className="text-2xl font-black text-olive-600">{metric.value}</p>
                        <p className="text-xs text-olive-300 tracking-wider uppercase mt-1">{metric.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Revenue Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-peach-50 border border-peach-400/20 p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-olive-600">Revenue vs Target</h3>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-terra-400" />
                            <span className="text-olive-300">Revenue</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-olive-300/30" />
                            <span className="text-olive-300">Target</span>
                        </div>
                    </div>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B3F2C" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#8B3F2C" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,84,56,0.1)" />
                            <XAxis dataKey="name" stroke="rgba(74,84,56,0.4)" fontSize={12} tickLine={false} />
                            <YAxis stroke="rgba(74,84,56,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#FAF3EB',
                                    border: '1px solid rgba(212,180,148,0.3)',
                                    borderRadius: '0',
                                }}
                                formatter={(value) => value !== undefined ? [`$${value.toLocaleString()}`, ''] : ['', '']}
                            />
                            <Area type="monotone" dataKey="target" stroke="rgba(74,84,56,0.3)" fill="transparent" strokeDasharray="5 5" />
                            <Area type="monotone" dataKey="revenue" stroke="#8B3F2C" fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Two Column Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Membership Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-peach-50 border border-peach-400/20 p-6"
                >
                    <h3 className="text-lg font-bold text-olive-600 mb-6">Membership Distribution</h3>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={membershipData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {membershipData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#FAF3EB',
                                        border: '1px solid rgba(212,180,148,0.3)',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        {membershipData.map(item => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-olive-300">{item.name} ({item.value})</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Class Popularity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-peach-50 border border-peach-400/20 p-6"
                >
                    <h3 className="text-lg font-bold text-olive-600 mb-6">Class Popularity</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={classPopularity} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,84,56,0.1)" />
                                <XAxis type="number" stroke="rgba(74,84,56,0.4)" fontSize={12} tickLine={false} />
                                <YAxis dataKey="name" type="category" stroke="rgba(74,84,56,0.4)" fontSize={12} tickLine={false} width={60} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#FAF3EB',
                                        border: '1px solid rgba(212,180,148,0.3)',
                                    }}
                                />
                                <Bar dataKey="bookings" fill="#8B3F2C" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Zone Utilization */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-peach-50 border border-peach-400/20 p-6"
            >
                <h3 className="text-lg font-bold text-olive-600 mb-6">Zone Utilization</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-peach-400/20">
                                <th className="text-left text-xs font-bold text-olive-600 tracking-wider pb-4">ZONE</th>
                                <th className="text-right text-xs font-bold text-olive-600 tracking-wider pb-4">BOOKINGS</th>
                                <th className="text-right text-xs font-bold text-olive-600 tracking-wider pb-4">UTILIZATION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topZones.map((zone) => (
                                <tr key={zone.name} className="border-b border-peach-400/10">
                                    <td className="py-4 font-medium text-olive-600">{zone.name}</td>
                                    <td className="py-4 text-right text-olive-400">{zone.bookings.toLocaleString()}</td>
                                    <td className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-2 bg-peach-300/40 overflow-hidden">
                                                <div
                                                    className="h-full bg-terra-400"
                                                    style={{ width: `${zone.utilization}%` }}
                                                />
                                            </div>
                                            <span className="text-olive-300 text-sm w-12">{zone.utilization}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}
