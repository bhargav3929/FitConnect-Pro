"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    Plus,
    Search,
    Filter,
    Calendar,
    Clock,
    Users,
    MapPin,
    MoreVertical,
    Edit,
    Trash2,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock classes data
const MOCK_CLASSES = [
    { id: "1", name: "HIIT Training", type: "Cardio", trainer: "John Smith", location: "Performance Floor", date: "2024-01-06", time: "06:00", duration: 45, capacity: 20, booked: 18, status: "scheduled" },
    { id: "2", name: "Yoga Flow", type: "Yoga", trainer: "Sarah Chen", location: "Heated Yoga Studio", date: "2024-01-06", time: "08:00", duration: 60, capacity: 15, booked: 12, status: "scheduled" },
    { id: "3", name: "Strength Training", type: "Strength", trainer: "Mike Wilson", location: "Olympic Platform", date: "2024-01-06", time: "10:00", duration: 50, capacity: 12, booked: 12, status: "full" },
    { id: "4", name: "Spin Class", type: "Cardio", trainer: "Emily Brown", location: "Cycling Theater", date: "2024-01-06", time: "12:00", duration: 45, capacity: 25, booked: 20, status: "scheduled" },
    { id: "5", name: "Pilates", type: "Flexibility", trainer: "Anna Lee", location: "Private Suite A", date: "2024-01-06", time: "14:00", duration: 55, capacity: 18, booked: 15, status: "scheduled" },
    { id: "6", name: "Boxing", type: "Combat", trainer: "James Rodriguez", location: "Combat Zone", date: "2024-01-05", time: "16:00", duration: 60, capacity: 20, booked: 20, status: "completed" },
]

const CLASS_TYPES = ["All Types", "Cardio", "Yoga", "Strength", "Flexibility", "Combat"]
const STATUSES = ["All Status", "scheduled", "full", "completed", "canceled"]

export default function ClassesPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState("All Types")
    const [statusFilter, setStatusFilter] = useState("All Status")

    const filteredClasses = MOCK_CLASSES.filter(cls => {
        const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cls.trainer.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = typeFilter === "All Types" || cls.type === typeFilter
        const matchesStatus = statusFilter === "All Status" || cls.status === statusFilter
        return matchesSearch && matchesType && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-500/20 text-blue-400'
            case 'full': return 'bg-yellow-500/20 text-yellow-400'
            case 'completed': return 'bg-green-500/20 text-green-400'
            case 'canceled': return 'bg-red-500/20 text-red-400'
            default: return 'bg-sand-200/10 text-sage-400'
        }
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
                        placeholder="Search classes or trainers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-forest-700 border border-forest-600 text-sand-200 placeholder:text-sage-500 focus:border-gold-400/50 focus:outline-none"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-12 px-4 bg-forest-700 border border-forest-600 text-sand-200 focus:border-gold-400/50 focus:outline-none appearance-none cursor-pointer"
                >
                    {CLASS_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
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

            {/* Classes Table */}
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
                                <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">TRAINER</th>
                                <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">SCHEDULE</th>
                                <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">ZONE</th>
                                <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">CAPACITY</th>
                                <th className="text-left text-xs font-bold text-sage-400 tracking-wider p-4">STATUS</th>
                                <th className="text-right text-xs font-bold text-sage-400 tracking-wider p-4">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClasses.map((cls, idx) => (
                                <tr
                                    key={cls.id}
                                    className="border-b border-forest-600/50 hover:bg-sand-200/5 transition-colors"
                                >
                                    <td className="p-4">
                                        <div>
                                            <p className="font-bold text-sand-200">{cls.name}</p>
                                            <p className="text-xs text-sage-500">{cls.type} • {cls.duration}min</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sand-200/80">{cls.trainer}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sage-400">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">{cls.date}</span>
                                            <Clock className="w-4 h-4 ml-2" />
                                            <span className="text-sm">{cls.time}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sage-400">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-sm">{cls.location}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-sage-500" />
                                            <span className="text-sand-200/80">{cls.booked}/{cls.capacity}</span>
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
                                                <DropdownMenuItem className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer">
                                                    <Trash2 className="w-4 h-4 mr-2" />
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
                                    <p className="font-bold text-sand-200">{cls.name}</p>
                                    <p className="text-xs text-sage-500">{cls.type} • {cls.duration}min</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(cls.status)}`}>
                                    {cls.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-sage-400">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {cls.trainer}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {cls.location}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {cls.date}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {cls.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            <div className="flex items-center justify-between text-sage-500 text-sm">
                <span>Showing {filteredClasses.length} of {MOCK_CLASSES.length} classes</span>
            </div>
        </div>
    )
}
