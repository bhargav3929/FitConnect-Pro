"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Search,
    Calendar,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreVertical,
    Eye,
    Trash2,
    Loader2,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAllBookings, callCancelBooking } from "@/lib/firebase/firestore"
import { Booking } from "@/types/booking"
import { toast } from "sonner"

const STATUS_FILTERS = ["All Status", "confirmed", "attended", "canceled", "no-show"]

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("All Status")
    const [cancelingId, setCancelingId] = useState<string | null>(null)

    useEffect(() => {
        fetchBookings()
    }, [])

    async function fetchBookings() {
        try {
            const data = await getAllBookings()
            setBookings(data)
        } catch {
            toast.error("Failed to load bookings")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancelBooking = async (bookingId: string) => {
        setCancelingId(bookingId)
        try {
            await callCancelBooking(bookingId)
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: 'canceled' as const } : b
            ))
            toast.success("Booking cancelled")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to cancel booking"
            toast.error(message)
        } finally {
            setCancelingId(null)
        }
    }

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = booking.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.classId.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "All Status" || booking.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const statusCounts = {
        attended: bookings.filter(b => b.status === 'attended').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        canceled: bookings.filter(b => b.status === 'canceled').length,
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <AlertCircle className="w-4 h-4 text-blue-500" />
            case 'attended': return <CheckCircle2 className="w-4 h-4 text-green-500" />
            case 'canceled': return <XCircle className="w-4 h-4 text-red-500" />
            case 'no-show': return <AlertCircle className="w-4 h-4 text-yellow-500" />
            default: return null
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-500/15 text-blue-600'
            case 'attended': return 'bg-green-500/15 text-green-600'
            case 'canceled': return 'bg-red-500/15 text-red-600'
            case 'no-show': return 'bg-yellow-500/15 text-yellow-600'
            default: return 'bg-peach-300/30 text-olive-400'
        }
    }

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatDateTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
        })
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-olive-600 font-display">Bookings</h2>
                    <p className="text-olive-300 text-sm mt-1">
                        View and manage class bookings
                    </p>
                </div>
                {!isLoading && (
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-olive-400">{statusCounts.attended} Attended</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-500" />
                            <span className="text-olive-400">{statusCounts.confirmed} Confirmed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-olive-400">{statusCounts.canceled} Canceled</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300" />
                    <input
                        type="text"
                        placeholder="Search by user or class ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-peach-50 border border-peach-400/20 text-olive-600 placeholder:text-olive-300/50 focus:border-terra-400 focus:outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 px-4 bg-peach-50 border border-peach-400/20 text-olive-600 focus:border-terra-400 focus:outline-none appearance-none cursor-pointer capitalize"
                >
                    {STATUS_FILTERS.map(status => (
                        <option key={status} value={status} className="capitalize">{status}</option>
                    ))}
                </select>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="bg-peach-50 border border-peach-400/20 overflow-hidden">
                    <div className="divide-y divide-peach-400/15">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-4 animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-peach-300/40 rounded-full" />
                                        <div>
                                            <div className="h-4 w-32 bg-peach-300/40 rounded mb-2" />
                                            <div className="h-3 w-24 bg-peach-200/60 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-20 bg-peach-200/60 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bookings Table */}
            {!isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-peach-50 border border-peach-400/20 overflow-hidden"
                >
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-peach-400/20 bg-peach-300/30">
                                    <th className="text-left text-xs font-bold text-olive-600 tracking-wider p-4">USER</th>
                                    <th className="text-left text-xs font-bold text-olive-600 tracking-wider p-4">SPOT</th>
                                    <th className="text-left text-xs font-bold text-olive-600 tracking-wider p-4">CLASS DATE</th>
                                    <th className="text-left text-xs font-bold text-olive-600 tracking-wider p-4">STATUS</th>
                                    <th className="text-left text-xs font-bold text-olive-600 tracking-wider p-4">BOOKED AT</th>
                                    <th className="text-left text-xs font-bold text-olive-600 tracking-wider p-4">GUEST</th>
                                    <th className="text-right text-xs font-bold text-olive-600 tracking-wider p-4">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking) => (
                                    <tr
                                        key={booking.id}
                                        className="border-b border-peach-400/10 hover:bg-peach-100 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-olive-300" />
                                                <span className="font-medium text-olive-600 text-sm truncate max-w-[160px]">
                                                    {booking.userId}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-olive-600 font-bold">#{booking.spotNumber}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-olive-300">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm">{formatDate(booking.classDate)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-olive-300 text-sm">
                                                <Clock className="w-3 h-3" />
                                                {formatDateTime(booking.bookingDate)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold ${booking.isGuest ? 'text-terra-400' : 'text-olive-300'}`}>
                                                {booking.isGuest ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-olive-600 transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-peach-50 border-peach-400/20">
                                                    <DropdownMenuItem className="text-olive-400 focus:bg-peach-200/50 focus:text-olive-600 cursor-pointer">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {booking.status === 'confirmed' && (
                                                        <DropdownMenuItem
                                                            className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer"
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                            disabled={cancelingId === booking.id}
                                                        >
                                                            {cancelingId === booking.id ? (
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                            )}
                                                            Cancel Booking
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden divide-y divide-peach-400/15">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="p-4 hover:bg-peach-100 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-olive-600 text-sm truncate max-w-[200px]">{booking.userId}</p>
                                        <p className="text-sm text-olive-300">Spot #{booking.spotNumber}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(booking.status)}`}>
                                        {getStatusIcon(booking.status)}
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-olive-300">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(booking.classDate)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {formatDateTime(booking.bookingDate)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredBookings.length === 0 && (
                        <div className="text-center py-12">
                            <Calendar className="w-8 h-8 text-olive-300/30 mx-auto mb-3" />
                            <p className="text-olive-300 text-sm">No bookings found</p>
                        </div>
                    )}
                </motion.div>
            )}

            {!isLoading && (
                <div className="flex items-center justify-between text-olive-300 text-sm">
                    <span>Showing {filteredBookings.length} of {bookings.length} bookings</span>
                </div>
            )}
        </div>
    )
}
