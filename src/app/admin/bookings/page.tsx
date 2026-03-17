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
            default: return 'bg-sand-200/10 text-sage-400'
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
                    <h2 className="text-2xl font-black text-sand-200 font-display">Bookings</h2>
                    <p className="text-sage-500 text-sm mt-1">
                        View and manage class bookings
                    </p>
                </div>
                {!isLoading && (
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-sage-400">{statusCounts.attended} Attended</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-400" />
                            <span className="text-sage-400">{statusCounts.confirmed} Confirmed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sage-400">{statusCounts.canceled} Canceled</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-500" />
                    <input
                        type="text"
                        placeholder="Search by user or class ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-forest-700 border border-forest-600 text-sand-200 placeholder:text-sage-500 focus:border-gold-400/50 focus:outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 px-4 bg-forest-700 border border-forest-600 text-sand-200 focus:border-gold-400/50 focus:outline-none appearance-none cursor-pointer capitalize"
                >
                    {STATUS_FILTERS.map(status => (
                        <option key={status} value={status} className="capitalize">{status}</option>
                    ))}
                </select>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="bg-forest-700 border border-forest-600 overflow-hidden">
                    <div className="divide-y divide-forest-600">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-4 animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-sand-200/5 rounded-full" />
                                        <div>
                                            <div className="h-4 w-32 bg-sand-200/10 rounded mb-2" />
                                            <div className="h-3 w-24 bg-sand-200/5 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-20 bg-sand-200/5 rounded" />
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
                    className="bg-forest-700 border border-forest-600 overflow-hidden"
                >
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-forest-600">
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">USER</th>
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">SPOT</th>
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">CLASS DATE</th>
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">STATUS</th>
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">BOOKED AT</th>
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">GUEST</th>
                                    <th className="text-right text-xs font-bold text-sage-400 tracking-wider p-4">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking) => (
                                    <tr
                                        key={booking.id}
                                        className="border-b border-forest-600/50 hover:bg-sand-200/5 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-sage-500" />
                                                <span className="font-medium text-sand-200 text-sm truncate max-w-[160px]">
                                                    {booking.userId}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sand-200 font-bold">#{booking.spotNumber}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sage-400">
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
                                            <div className="flex items-center gap-2 text-sage-500 text-sm">
                                                <Clock className="w-3 h-3" />
                                                {formatDateTime(booking.bookingDate)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold ${booking.isGuest ? 'text-gold-400' : 'text-sage-500'}`}>
                                                {booking.isGuest ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-8 h-8 flex items-center justify-center text-sage-500 hover:text-sand-200 transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-forest-700 border-forest-600">
                                                    <DropdownMenuItem className="text-sand-200/70 focus:bg-sand-200/10 focus:text-sand-200 cursor-pointer">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {booking.status === 'confirmed' && (
                                                        <DropdownMenuItem
                                                            className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer"
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
                    <div className="lg:hidden divide-y divide-forest-600">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="p-4 hover:bg-sand-200/5 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-sand-200 text-sm truncate max-w-[200px]">{booking.userId}</p>
                                        <p className="text-sm text-sage-500">Spot #{booking.spotNumber}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(booking.status)}`}>
                                        {getStatusIcon(booking.status)}
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-sage-400">
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
                            <Calendar className="w-8 h-8 text-sand-200/20 mx-auto mb-3" />
                            <p className="text-sage-500 text-sm">No bookings found</p>
                        </div>
                    )}
                </motion.div>
            )}

            {!isLoading && (
                <div className="flex items-center justify-between text-sage-500 text-sm">
                    <span>Showing {filteredBookings.length} of {bookings.length} bookings</span>
                </div>
            )}
        </div>
    )
}
