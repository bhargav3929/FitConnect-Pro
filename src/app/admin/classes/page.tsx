"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Plus,
    Search,
    Calendar,
    Clock,
    Users,
    MapPin,
    MoreVertical,
    Edit,
    Trash2,
    Loader2,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAllClasses, callDeleteClass } from "@/lib/firebase/firestore"
import { ClassSession } from "@/types/class"
import { toast } from "sonner"

const STATUSES = ["All Status", "scheduled", "ongoing", "completed", "canceled"]

export default function ClassesPage() {
    const [classes, setClasses] = useState<ClassSession[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("All Status")
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        fetchClasses()
    }, [])

    async function fetchClasses() {
        try {
            const data = await getAllClasses()
            setClasses(data)
        } catch {
            toast.error("Failed to load classes")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (classId: string) => {
        setDeletingId(classId)
        try {
            await callDeleteClass(classId, "Canceled by admin")
            setClasses(prev => prev.filter(c => c.id !== classId))
            toast.success("Class deleted")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to delete class"
            toast.error(message)
        } finally {
            setDeletingId(null)
        }
    }

    const filteredClasses = classes.filter(cls => {
        const matchesSearch = (cls.classType || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "All Status" || cls.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-500/20 text-blue-400'
            case 'ongoing': return 'bg-gold-400/20 text-gold-400'
            case 'completed': return 'bg-green-500/20 text-green-400'
            case 'canceled': return 'bg-red-500/20 text-red-400'
            default: return 'bg-sand-200/10 text-sage-400'
        }
    }

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatTime = (time: string) => {
        const [h, m] = time.split(':')
        const hour = parseInt(h, 10)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour}:${m} ${ampm}`
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-sand-200 font-display">Classes</h2>
                    <p className="text-sage-500 text-sm mt-1">
                        Manage all fitness classes and schedules
                    </p>
                </div>
                <button className="px-6 py-3 bg-gold-400 text-forest-700 font-bold text-sm tracking-wider hover:bg-gold-300 transition-all flex items-center gap-2 w-fit">
                    <Plus className="w-4 h-4" />
                    ADD CLASS
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-500" />
                    <input
                        type="text"
                        placeholder="Search classes..."
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
                    {STATUSES.map(status => (
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
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className="h-5 w-32 bg-sand-200/10 rounded mb-2" />
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

            {/* Classes Table */}
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
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">CLASS</th>
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">SCHEDULE</th>
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">LOCATION</th>
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">CAPACITY</th>
                                    <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">STATUS</th>
                                    <th className="text-right text-xs font-bold text-sage-400 tracking-wider p-4">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClasses.map((cls) => (
                                    <tr
                                        key={cls.id}
                                        className="border-b border-forest-600/50 hover:bg-sand-200/5 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div>
                                                <p className="font-bold text-sand-200">{cls.classType || 'Pilates Class'}</p>
                                                <p className="text-xs text-sage-500">{cls.duration}min{cls.difficultyLevel ? ` · ${cls.difficultyLevel}` : ''}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sage-400">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm">{formatDate(cls.date)}</span>
                                                <Clock className="w-4 h-4 ml-2" />
                                                <span className="text-sm">{formatTime(cls.startTime)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sage-400">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-sm">{cls.location || 'Main Studio'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-sage-500" />
                                                <span className="text-sand-200/80">{cls.bookedCount}/{cls.totalSpots || cls.capacity}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(cls.status)}`}>
                                                {cls.status}
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
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit Class
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer"
                                                        onClick={() => handleDelete(cls.id)}
                                                        disabled={deletingId === cls.id}
                                                    >
                                                        {deletingId === cls.id ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                        )}
                                                        Delete
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
                    <div className="lg:hidden divide-y divide-forest-600">
                        {filteredClasses.map((cls) => (
                            <div key={cls.id} className="p-4 hover:bg-sand-200/5 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-sand-200">{cls.classType || 'Pilates Class'}</p>
                                        <p className="text-xs text-sage-500">{cls.duration}min</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(cls.status)}`}>
                                        {cls.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-sage-400">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {cls.bookedCount}/{cls.totalSpots || cls.capacity}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {cls.location || 'Main Studio'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(cls.date)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {formatTime(cls.startTime)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredClasses.length === 0 && (
                        <div className="text-center py-12">
                            <Calendar className="w-8 h-8 text-sand-200/20 mx-auto mb-3" />
                            <p className="text-sage-500 text-sm">No classes found</p>
                        </div>
                    )}
                </motion.div>
            )}

            {!isLoading && (
                <div className="flex items-center justify-between text-sage-500 text-sm">
                    <span>Showing {filteredClasses.length} of {classes.length} classes</span>
                </div>
            )}
        </div>
    )
}
