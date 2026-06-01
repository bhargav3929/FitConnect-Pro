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
    Dumbbell,
    CheckCircle2,
    XCircle,
    Timer,
    Zap,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PaginationControls } from "@/components/ui/pagination-controls"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    callCreateClass,
    callDeleteClass,
    callUpdateClass,
    getClassesPage,
    getTrainers,
    type FirestorePageCursor,
} from "@fitconnect/shared/firebase/firestore"
import { ClassSession } from "@fitconnect/shared/types/class"
import { Trainer } from "@fitconnect/shared/types/trainer"
import { toast } from "sonner"

const STATUSES = ["All Status", "scheduled", "ongoing", "completed", "canceled"]
const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const
const LOCATIONS = ["Main Studio", "Reformer Studio", "Mat Studio", "Private Suite", "Barre & Stretch", "Recovery Lounge"]
const PAGE_SIZE = 12

const CLASS_TYPES = [
    { name: "Sol Flow", description: "Strength meets movement in this smooth, continuous reformer class. No breaks, just flow.", timeSlots: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00"] },
    { name: "Sol Cardio", description: "Fast-paced movement that gets your heart rate up.", timeSlots: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00"] },
    { name: "Sol Stretch", description: "Hit reset on your body, one stretch at a time.", timeSlots: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00"] },
] as const

interface ClassFormData {
    trainerId: string
    date: string
    startTime: string
    duration: number
    capacity: number
    classType: string
    difficultyLevel: "beginner" | "intermediate" | "advanced"
    location: string
    description: string
}

const defaultFormData: ClassFormData = {
    trainerId: "",
    date: "",
    startTime: "08:00",
    duration: 50,
    capacity: 12,
    classType: "Sol Flow",
    difficultyLevel: "intermediate",
    location: "Main Studio",
    description: "",
}

export default function ClassesPage() {
    const [classes, setClasses] = useState<ClassSession[]>([])
    const [totalClasses, setTotalClasses] = useState(0)
    const [trainers, setTrainers] = useState<Trainer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("All Status")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [requestedPage, setRequestedPage] = useState(1)
    const [pageCursors, setPageCursors] = useState<FirestorePageCursor[]>([null])
    const currentCursor = pageCursors[requestedPage - 1] || null

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingClass, setEditingClass] = useState<ClassSession | null>(null)
    const [formData, setFormData] = useState<ClassFormData>(defaultFormData)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        let cancelled = false
        getTrainers()
            .then((data) => {
                if (!cancelled) setTrainers(data)
            })
            .catch(() => {
                // Trainers load silently
            })
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        getClassesPage({
            pageSize: PAGE_SIZE,
            cursor: currentCursor,
            status: statusFilter === "All Status" ? undefined : statusFilter as ClassSession['status'],
        })
            .then((pageResult) => {
                if (cancelled) return
                setClasses(pageResult.items)
                setTotalClasses(pageResult.total)
                setPageCursors(prev => {
                    const next = prev.slice(0, requestedPage)
                    next[requestedPage] = pageResult.nextCursor
                    return next
                })
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load classes")
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [requestedPage, currentCursor, statusFilter])

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

    const openAddDialog = () => {
        setEditingClass(null)
        setFormData({
            ...defaultFormData,
            trainerId: trainers.length > 0 ? trainers[0].id : "",
        })
        setDialogOpen(true)
    }

    const openEditDialog = (cls: ClassSession) => {
        setEditingClass(cls)
        const dateStr = cls.date instanceof Date
            ? cls.date.toISOString().split('T')[0]
            : new Date(cls.date).toISOString().split('T')[0]
        setFormData({
            trainerId: cls.trainerId || "",
            date: dateStr,
            startTime: cls.startTime || "09:00",
            duration: cls.duration || 50,
            capacity: cls.totalSpots || cls.capacity || 12,
            classType: cls.classType || "Pilates",
            difficultyLevel: cls.difficultyLevel || "intermediate",
            location: cls.location || "Main Studio",
            description: cls.description || "",
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.trainerId) {
            toast.error("Please select a trainer")
            return
        }
        if (!formData.date) {
            toast.error("Please select a date")
            return
        }

        setIsSaving(true)
        try {
            if (editingClass) {
                await callUpdateClass({
                    classId: editingClass.id,
                    trainerId: formData.trainerId,
                    date: formData.date,
                    startTime: formData.startTime,
                    duration: formData.duration,
                    capacity: formData.capacity,
                    classType: formData.classType,
                    difficultyLevel: formData.difficultyLevel,
                    location: formData.location,
                    description: formData.description,
                    totalSpots: formData.capacity,
                })
                toast.success("Class updated successfully")
            } else {
                await callCreateClass({
                    trainerId: formData.trainerId,
                    date: formData.date,
                    startTime: formData.startTime,
                    duration: formData.duration,
                    capacity: formData.capacity,
                    classType: formData.classType,
                    difficultyLevel: formData.difficultyLevel,
                    location: formData.location,
                    description: formData.description,
                    totalSpots: formData.capacity,
                })
                toast.success("Class created successfully")
            }
            setDialogOpen(false)
            setIsLoading(true)
            setRequestedPage(1)
            setPageCursors([null])
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save class"
            toast.error(message)
        } finally {
            setIsSaving(false)
        }
    }

    const filteredClasses = classes.filter(cls => {
        const matchesSearch = (cls.classType || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "All Status" || cls.status === statusFilter
        return matchesSearch && matchesStatus
    })
    const totalPages = Math.max(1, Math.ceil(totalClasses / PAGE_SIZE))
    const page = Math.min(requestedPage, totalPages)
    const paginatedClasses = filteredClasses

    const scheduledCount = classes.filter(c => c.status === 'scheduled').length
    const completedCount = classes.filter(c => c.status === 'completed').length
    const totalCapacity = classes.reduce((sum, c) => sum + (c.totalSpots || c.capacity || 0), 0)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20'
            case 'ongoing': return 'bg-terra-400/10 text-terra-400 ring-1 ring-terra-400/20'
            case 'completed': return 'bg-green-500/10 text-green-700 ring-1 ring-green-500/20'
            case 'canceled': return 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20'
            default: return 'bg-peach-300/30 text-olive-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'scheduled': return <Clock className="w-3 h-3" />
            case 'ongoing': return <Zap className="w-3 h-3" />
            case 'completed': return <CheckCircle2 className="w-3 h-3" />
            case 'canceled': return <XCircle className="w-3 h-3" />
            default: return null
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

    const getTrainerName = (trainerId: string) => {
        return trainers.find(t => t.id === trainerId)?.name || 'Unassigned'
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20 lg:pb-0">
            {/* Premium Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-peach-400/20"
            >
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-normal mb-2 font-display">
                        Classes
                    </h2>
                    <p className="text-olive-300 text-sm md:text-base tracking-wide max-w-lg">
                        Schedule, manage, and track all fitness classes and their capacity across your studio.
                    </p>
                </div>
                <button
                    onClick={openAddDialog}
                    className="px-6 py-3.5 bg-terra-400 text-peach-50 font-bold text-xs tracking-[0.2em] uppercase hover:bg-terra-300 transition-all flex items-center gap-2.5 w-fit hover:shadow-lg hover:shadow-terra-400/15 active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    Add Class
                </button>
            </motion.div>

            {/* Summary Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {[
                    { label: "Total Classes", value: classes.length, icon: Dumbbell },
                    { label: "Scheduled", value: scheduledCount, icon: Calendar },
                    { label: "Completed", value: completedCount, icon: CheckCircle2 },
                    { label: "Total Capacity", value: totalCapacity, icon: Users },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="group relative overflow-hidden bg-peach-50 border border-peach-400/20 p-5 hover:border-terra-400/30 transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-terra-400/5 rounded-full blur-2xl -mr-12 -mt-12 transition-opacity opacity-0 group-hover:opacity-100 duration-500" />
                        <stat.icon className="w-5 h-5 text-olive-300 mb-3 group-hover:text-terra-400 transition-colors" />
                        {isLoading ? (
                            <div className="h-8 w-16 bg-peach-300/40 rounded animate-pulse mb-1" />
                        ) : (
                            <p className="text-2xl font-black text-olive-600 tracking-normal">{stat.value.toLocaleString()}</p>
                        )}
                        <p className="text-[11px] text-olive-300 tracking-[0.15em] uppercase font-semibold mt-1">{stat.label}</p>
                    </div>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300 group-focus-within:text-terra-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search classes..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setRequestedPage(1)
                        }}
                        className="w-full h-12 pl-11 pr-4 bg-peach-50 border border-peach-400/20 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:outline-none focus:bg-peach-50 transition-all duration-300"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setRequestedPage(1)
                        setPageCursors([null])
                    }}
                    className="h-12 px-4 bg-peach-50 border border-peach-400/20 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer capitalize hover:border-peach-400/40 transition-colors"
                >
                    {STATUSES.map(status => (
                        <option key={status} value={status} className="capitalize">{status}</option>
                    ))}
                </select>
            </motion.div>

            {/* Loading State */}
            {isLoading && (
                <div className="bg-peach-50 border border-peach-400/20 overflow-hidden">
                    <div className="divide-y divide-peach-400/10">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-peach-300/30 rounded" />
                                        <div>
                                            <div className="h-4 w-36 bg-peach-300/30 rounded mb-2" />
                                            <div className="h-3 w-24 bg-peach-200/50 rounded" />
                                        </div>
                                    </div>
                                    <div className="hidden lg:flex items-center gap-8">
                                        <div className="h-5 w-28 bg-peach-200/50 rounded" />
                                        <div className="h-5 w-20 bg-peach-200/50 rounded" />
                                    </div>
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
                    transition={{ delay: 0.3 }}
                    className="bg-peach-50 border border-peach-400/20 overflow-hidden"
                >
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-peach-400/15 bg-peach-200/30">
                                    <th className="text-left text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase p-4 pl-6">Class</th>
                                    <th className="text-left text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase p-4">Trainer</th>
                                    <th className="text-left text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase p-4">Schedule</th>
                                    <th className="text-left text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase p-4">Location</th>
                                    <th className="text-left text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase p-4">Capacity</th>
                                    <th className="text-left text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase p-4">Status</th>
                                    <th className="text-right text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase p-4 pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedClasses.map((cls, idx) => (
                                    <motion.tr
                                        key={cls.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.35 + idx * 0.03 }}
                                        className="border-b border-peach-400/8 hover:bg-peach-100/80 transition-colors duration-200 group"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center group-hover:bg-terra-400/10 transition-colors">
                                                    <Dumbbell className="w-5 h-5 text-olive-400 group-hover:text-terra-400 transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-olive-600 text-sm">{cls.classType || 'Pilates Class'}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Timer className="w-3 h-3 text-olive-300" />
                                                        <span className="text-xs text-olive-300">{cls.duration}min</span>
                                                        {cls.difficultyLevel && (
                                                            <>
                                                                <span className="text-olive-300/30">&bull;</span>
                                                                <span className="text-xs text-olive-300 capitalize">{cls.difficultyLevel}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-olive-400 text-sm font-medium">{getTrainerName(cls.trainerId)}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-olive-400">
                                                    <Calendar className="w-3.5 h-3.5 text-olive-300" />
                                                    <span className="text-sm">{formatDate(cls.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-olive-300">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-xs">{formatTime(cls.startTime)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-olive-300">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="text-sm">{cls.location || 'Main Studio'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 max-w-[80px]">
                                                    <div className="h-1.5 bg-peach-300/30 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-terra-400 rounded-full transition-all"
                                                            style={{ width: `${Math.min(100, (cls.bookedCount / (cls.totalSpots || cls.capacity || 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-olive-400 text-sm font-medium">{cls.bookedCount}/{cls.totalSpots || cls.capacity}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm ${getStatusColor(cls.status)}`}>
                                                {getStatusIcon(cls.status)}
                                                {cls.status}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-olive-600 hover:bg-peach-200/50 rounded-md transition-all">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-peach-50/95 backdrop-blur-xl border-peach-400/15 shadow-xl shadow-black/5">
                                                    <DropdownMenuItem
                                                        className="text-olive-400 focus:bg-peach-200/50 focus:text-olive-600 cursor-pointer gap-2"
                                                        onClick={() => openEditDialog(cls)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Edit Class
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer gap-2"
                                                        onClick={() => handleDelete(cls.id)}
                                                        disabled={deletingId === cls.id}
                                                    >
                                                        {deletingId === cls.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden divide-y divide-peach-400/10">
                        {paginatedClasses.map((cls, idx) => (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + idx * 0.05 }}
                                className="p-4 hover:bg-peach-100/60 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center flex-shrink-0">
                                            <Dumbbell className="w-5 h-5 text-olive-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-olive-600 text-sm">{cls.classType || 'Pilates Class'}</p>
                                            <p className="text-xs text-olive-300">{cls.duration}min{cls.difficultyLevel ? ` · ${cls.difficultyLevel}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm ${getStatusColor(cls.status)}`}>
                                            {getStatusIcon(cls.status)}
                                            {cls.status}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-7 h-7 flex items-center justify-center text-olive-300 hover:text-olive-600 rounded transition-all">
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-peach-50/95 backdrop-blur-xl border-peach-400/15 shadow-xl shadow-black/5">
                                                <DropdownMenuItem
                                                    className="text-olive-400 focus:bg-peach-200/50 focus:text-olive-600 cursor-pointer gap-2"
                                                    onClick={() => openEditDialog(cls)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer gap-2"
                                                    onClick={() => handleDelete(cls.id)}
                                                    disabled={deletingId === cls.id}
                                                >
                                                    {deletingId === cls.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm text-olive-300 ml-[52px]">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{cls.bookedCount}/{cls.totalSpots || cls.capacity}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{cls.location || 'Main Studio'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{formatDate(cls.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{formatTime(cls.startTime)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filteredClasses.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-peach-200/40 flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-olive-300/30" />
                            </div>
                            <p className="text-olive-600 font-bold mb-1">No classes found</p>
                            <p className="text-olive-300 text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                    {filteredClasses.length > 0 && (
                        <PaginationControls
                            page={page}
                            totalItems={totalClasses}
                            pageSize={PAGE_SIZE}
                            itemLabel="classes"
                            onPageChange={setRequestedPage}
                        />
                    )}
                </motion.div>
            )}

            {/* Footer Summary */}
            {!isLoading && filteredClasses.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between text-olive-300 text-xs tracking-wider"
                >
                    <span>Showing {filteredClasses.length} of {classes.length} classes</span>
                    <span className="font-mono bg-peach-200/30 px-3 py-1 rounded-full border border-peach-400/15">
                        {scheduledCount} upcoming &bull; {completedCount} completed
                    </span>
                </motion.div>
            )}

            {/* ═══════════ ADD / EDIT CLASS DIALOG ═══════════ */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-peach-50 border-peach-400/20 max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-olive-600">
                            {editingClass ? 'Edit Class' : 'Add New Class'}
                        </DialogTitle>
                        <DialogDescription className="text-olive-300 text-sm">
                            {editingClass
                                ? 'Update the class details below.'
                                : 'Fill in the details to schedule a new class.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 mt-2">
                        {/* Class Type */}
                        <div>
                            <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                Class Type
                            </label>
                            <select
                                value={formData.classType}
                                onChange={(e) => {
                                    const selected = CLASS_TYPES.find(ct => ct.name === e.target.value)
                                    setFormData(prev => ({
                                        ...prev,
                                        classType: e.target.value,
                                        description: selected?.description || prev.description,
                                        startTime: selected?.timeSlots[0] || prev.startTime,
                                    }))
                                }}
                                className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none appearance-none cursor-pointer transition-all text-sm"
                            >
                                {CLASS_TYPES.map(ct => (
                                    <option key={ct.name} value={ct.name}>{ct.name}</option>
                                ))}
                            </select>
                            <p className="mt-1.5 text-xs text-olive-300/60 italic">
                                {CLASS_TYPES.find(ct => ct.name === formData.classType)?.description}
                            </p>
                        </div>

                        {/* Trainer */}
                        <div>
                            <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                Trainer
                            </label>
                            <select
                                value={formData.trainerId}
                                onChange={(e) => setFormData(prev => ({ ...prev, trainerId: e.target.value }))}
                                className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer transition-all text-sm"
                            >
                                <option value="">Select a trainer...</option>
                                {trainers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date + Time row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Start Time
                                </label>
                                <select
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer transition-all text-sm"
                                >
                                    {(CLASS_TYPES.find(ct => ct.name === formData.classType)?.timeSlots ?? []).map(slot => {
                                        const [h, m] = slot.split(':')
                                        const hour = parseInt(h, 10)
                                        const ampm = hour >= 12 ? 'PM' : 'AM'
                                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                                        return (
                                            <option key={slot} value={slot}>{`${displayHour}:${m} ${ampm}`}</option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Duration + Capacity row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Duration (min)
                                </label>
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 50 }))}
                                    min={15}
                                    max={180}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Capacity (spots)
                                </label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 12 }))}
                                    min={1}
                                    max={100}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Difficulty + Location row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Difficulty
                                </label>
                                <select
                                    value={formData.difficultyLevel}
                                    onChange={(e) => setFormData(prev => ({ ...prev, difficultyLevel: e.target.value as ClassFormData['difficultyLevel'] }))}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer transition-all text-sm capitalize"
                                >
                                    {DIFFICULTY_LEVELS.map(level => (
                                        <option key={level} value={level} className="capitalize">{level}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Location
                                </label>
                                <select
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer transition-all text-sm"
                                >
                                    {LOCATIONS.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                Description (optional)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of the class..."
                                rows={3}
                                className="w-full px-4 py-3 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:outline-none transition-all text-sm resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDialogOpen(false)}
                                className="px-5 py-2.5 text-olive-400 font-bold text-xs tracking-[0.15em] uppercase hover:bg-peach-200/50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-terra-400 text-peach-50 font-bold text-xs tracking-[0.15em] uppercase hover:bg-terra-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-terra-400/15"
                            >
                                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {editingClass ? 'Update Class' : 'Create Class'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
