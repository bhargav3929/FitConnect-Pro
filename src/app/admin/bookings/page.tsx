"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    Search,
    Calendar,
    Clock,
    MapPin,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreVertical,
    Eye,
    Trash2,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock bookings data
const MOCK_BOOKINGS = [
    { id: "1", member: "John Doe", class: "HIIT Training", trainer: "John Smith", location: "Performance Floor", date: "2024-01-06", time: "06:00", status: "confirmed", bookedAt: "2024-01-05 18:30" },
    { id: "2", member: "Jane Smith", class: "Yoga Flow", trainer: "Sarah Chen", location: "Heated Yoga Studio", date: "2024-01-06", time: "08:00", status: "confirmed", bookedAt: "2024-01-05 14:15" },
    { id: "3", member: "Robert Johnson", class: "Strength Training", trainer: "Mike Wilson", location: "Olympic Platform", date: "2024-01-06", time: "10:00", status: "attended", bookedAt: "2024-01-04 09:00" },
    { id: "4", member: "Emily Davis", class: "Spin Class", trainer: "Emily Brown", location: "Cycling Theater", date: "2024-01-06", time: "12:00", status: "confirmed", bookedAt: "2024-01-05 20:45" },
    { id: "5", member: "Michael Brown", class: "Pilates", trainer: "Anna Lee", location: "Private Suite A", date: "2024-01-06", time: "14:00", status: "canceled", bookedAt: "2024-01-05 11:30" },
    { id: "6", member: "Sarah Wilson", class: "Boxing", trainer: "James Rodriguez", location: "Combat Zone", date: "2024-01-05", time: "16:00", status: "no-show", bookedAt: "2024-01-04 16:00" },
    { id: "7", member: "David Lee", class: "HIIT Training", trainer: "John Smith", location: "Performance Floor", date: "2024-01-05", time: "06:00", status: "attended", bookedAt: "2024-01-04 08:00" },
    { id: "8", member: "Lisa Chen", class: "Yoga Flow", trainer: "Sarah Chen", location: "Heated Yoga Studio", date: "2024-01-05", time: "08:00", status: "attended", bookedAt: "2024-01-04 19:30" },
]

const STATUS_FILTERS = ["All Status", "confirmed", "attended", "canceled", "no-show"]

export default function BookingsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("All Status")

    const filteredBookings = MOCK_BOOKINGS.filter(booking => {
        const matchesSearch = booking.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.class.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "All Status" || booking.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <AlertCircle className="w-4 h-4 text-blue-400" />
            case 'attended': return <CheckCircle2 className="w-4 h-4 text-green-400" />
            case 'canceled': return <XCircle className="w-4 h-4 text-red-400" />
            case 'no-show': return <AlertCircle className="w-4 h-4 text-yellow-400" />
            default: return null
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-500/20 text-blue-400'
            case 'attended': return 'bg-green-500/20 text-green-400'
            case 'canceled': return 'bg-red-500/20 text-red-400'
            case 'no-show': return 'bg-yellow-500/20 text-yellow-400'
            default: return 'bg-[#F0F2F5]/10 text-[#8892A4]'
        }
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white">Bookings</h2>
                    <p className="text-[#5A6478] text-sm mt-1">
                        View and manage class bookings
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-[#8892A4]">{MOCK_BOOKINGS.filter(b => b.status === 'attended').length} Attended</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-400" />
                            <span className="text-[#8892A4]">{MOCK_BOOKINGS.filter(b => b.status === 'confirmed').length} Confirmed</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6478]" />
                    <input
                        type="text"
                        placeholder="Search by member or class..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-[#0B0F19] border border-[#1A2238] text-white placeholder:text-[#5A6478] focus:border-coral-400/50 focus:outline-none"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 px-4 bg-[#0B0F19] border border-[#1A2238] text-white focus:border-coral-400/50 focus:outline-none appearance-none cursor-pointer capitalize"
                >
                    {STATUS_FILTERS.map(status => (
                        <option key={status} value={status} className="capitalize">{status}</option>
                    ))}
                </select>
            </div>

            {/* Bookings Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0B0F19] border border-[#1A2238] overflow-hidden"
            >
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A2238]">
                                <th className="text-left text-xs font-bold text-[#8892A4] tracking-wider p-4">MEMBER</th>
                                <th className="text-left text-xs font-bold text-[#8892A4] tracking-wider p-4">CLASS</th>
                                <th className="text-left text-xs font-bold text-[#8892A4] tracking-wider p-4">TRAINER</th>
                                <th className="text-left text-xs font-bold text-[#8892A4] tracking-wider p-4">SCHEDULE</th>
                                <th className="text-left text-xs font-bold text-[#8892A4] tracking-wider p-4">STATUS</th>
                                <th className="text-left text-xs font-bold text-[#8892A4] tracking-wider p-4">BOOKED AT</th>
                                <th className="text-right text-xs font-bold text-[#8892A4] tracking-wider p-4">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking) => (
                                <tr
                                    key={booking.id}
                                    className="border-b border-[#1A2238]/50 hover:bg-[#F0F2F5]/5 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-[#5A6478]" />
                                            <span className="font-medium text-white">{booking.member}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[#F0F2F5]/80">{booking.class}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[#8892A4]">{booking.trainer}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-[#8892A4]">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">{booking.date}</span>
                                            <Clock className="w-4 h-4 ml-2" />
                                            <span className="text-sm">{booking.time}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[#5A6478] text-sm">{booking.bookedAt}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-8 h-8 flex items-center justify-center text-[#5A6478] hover:text-white transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#0B0F19] border-[#1A2238]">
                                                <DropdownMenuItem className="text-[#F0F2F5]/70 focus:bg-[#F0F2F5]/10 focus:text-white cursor-pointer">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Cancel Booking
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-[#1A2238]">
                    {filteredBookings.map((booking) => (
                        <div key={booking.id} className="p-4 hover:bg-[#F0F2F5]/5 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-bold text-white">{booking.member}</p>
                                    <p className="text-sm text-[#5A6478]">{booking.class}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(booking.status)}`}>
                                    {getStatusIcon(booking.status)}
                                    {booking.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-[#8892A4]">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {booking.date}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {booking.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Pagination placeholder */}
            <div className="flex items-center justify-between text-[#5A6478] text-sm">
                <span>Showing {filteredBookings.length} of {MOCK_BOOKINGS.length} bookings</span>
            </div>
        </div>
    )
}
