"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    Plus,
    Search,
    MapPin,
    Phone,
    Mail,
    Clock,
    MoreVertical,
    Edit,
    Trash2,
    Power,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock locations data
const MOCK_LOCATIONS = [
    {
        id: "1",
        name: "FitPro Downtown",
        address: "123 Main St, New York, NY 10001",
        phone: "+1 (555) 123-4567",
        email: "downtown@fitpro.com",
        hours: "5:00 AM - 11:00 PM",
        trainers: 8,
        activeClasses: 24,
        isActive: true,
    },
    {
        id: "2",
        name: "FitPro Midtown",
        address: "456 Park Ave, New York, NY 10022",
        phone: "+1 (555) 234-5678",
        email: "midtown@fitpro.com",
        hours: "6:00 AM - 10:00 PM",
        trainers: 6,
        activeClasses: 18,
        isActive: true,
    },
    {
        id: "3",
        name: "FitPro Uptown",
        address: "789 Broadway, New York, NY 10025",
        phone: "+1 (555) 345-6789",
        email: "uptown@fitpro.com",
        hours: "5:30 AM - 10:30 PM",
        trainers: 5,
        activeClasses: 15,
        isActive: true,
    },
    {
        id: "4",
        name: "FitPro Brooklyn",
        address: "321 Atlantic Ave, Brooklyn, NY 11201",
        phone: "+1 (555) 456-7890",
        email: "brooklyn@fitpro.com",
        hours: "6:00 AM - 9:00 PM",
        trainers: 4,
        activeClasses: 12,
        isActive: false,
    },
]

export default function LocationsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [showActive, setShowActive] = useState<"all" | "active" | "inactive">("all")

    const filteredLocations = MOCK_LOCATIONS.filter(loc => {
        const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.address.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = showActive === "all" ||
            (showActive === "active" && loc.isActive) ||
            (showActive === "inactive" && !loc.isActive)
        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white">Locations</h2>
                    <p className="text-white/40 text-sm mt-1">
                        Manage gym locations and facilities
                    </p>
                </div>
                <button className="px-6 py-3 bg-white text-black font-bold text-sm tracking-wider hover:bg-white/90 transition-all flex items-center gap-2 w-fit">
                    <Plus className="w-4 h-4" />
                    ADD LOCATION
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-black border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex border border-white/10">
                    {(["all", "active", "inactive"] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setShowActive(status)}
                            className={`px-4 py-3 text-sm font-bold tracking-wider capitalize transition-colors ${showActive === status
                                    ? 'bg-white text-black'
                                    : 'text-white/50 hover:text-white'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Locations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredLocations.map((location, idx) => (
                    <motion.div
                        key={location.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-black border p-6 hover:border-white/30 transition-colors group ${location.isActive ? 'border-white/10' : 'border-white/5'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-white">{location.name}</h3>
                                    <span className={`px-2 py-1 text-xs font-bold tracking-wider ${location.isActive
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {location.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-black border-white/10">
                                    <DropdownMenuItem className="text-white/70 focus:bg-white/10 focus:text-white cursor-pointer">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Location
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-white/70 focus:bg-white/10 focus:text-white cursor-pointer">
                                        <Power className="w-4 h-4 mr-2" />
                                        {location.isActive ? 'Deactivate' : 'Activate'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Details */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 text-white/60">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{location.address}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/60">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{location.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/60">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{location.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/60">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{location.hours}</span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                            <div>
                                <p className="text-2xl font-black text-white">{location.trainers}</p>
                                <p className="text-xs text-white/40 tracking-wider uppercase">Trainers</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{location.activeClasses}</p>
                                <p className="text-xs text-white/40 tracking-wider uppercase">Active Classes</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
