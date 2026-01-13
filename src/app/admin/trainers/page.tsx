"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    Plus,
    Search,
    Star,
    MapPin,
    MoreVertical,
    Edit,
    Trash2,
    Mail,
    Phone,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Mock trainers data
const MOCK_TRAINERS = [
    {
        id: "1",
        name: "John Smith",
        email: "john@fitpro.com",
        phone: "+1 (555) 111-1111",
        specialties: ["HIIT", "Strength", "CrossFit"],
        experience: 8,
        rating: 4.9,
        totalClasses: 156,
        locations: ["Downtown", "Midtown"],
        isActive: true,
    },
    {
        id: "2",
        name: "Sarah Chen",
        email: "sarah@fitpro.com",
        phone: "+1 (555) 222-2222",
        specialties: ["Yoga", "Pilates", "Meditation"],
        experience: 6,
        rating: 4.8,
        totalClasses: 142,
        locations: ["Midtown"],
        isActive: true,
    },
    {
        id: "3",
        name: "Mike Wilson",
        email: "mike@fitpro.com",
        phone: "+1 (555) 333-3333",
        specialties: ["Strength", "Bodybuilding"],
        experience: 10,
        rating: 4.7,
        totalClasses: 203,
        locations: ["Downtown"],
        isActive: true,
    },
    {
        id: "4",
        name: "Emily Brown",
        email: "emily@fitpro.com",
        phone: "+1 (555) 444-4444",
        specialties: ["Spin", "Cardio", "Dance"],
        experience: 4,
        rating: 4.6,
        totalClasses: 98,
        locations: ["Uptown", "Brooklyn"],
        isActive: true,
    },
    {
        id: "5",
        name: "James Rodriguez",
        email: "james@fitpro.com",
        phone: "+1 (555) 555-5555",
        specialties: ["Boxing", "MMA", "Kickboxing"],
        experience: 7,
        rating: 4.9,
        totalClasses: 178,
        locations: ["Midtown", "Downtown"],
        isActive: true,
    },
    {
        id: "6",
        name: "Anna Lee",
        email: "anna@fitpro.com",
        phone: "+1 (555) 666-6666",
        specialties: ["Pilates", "Flexibility", "Recovery"],
        experience: 5,
        rating: 4.8,
        totalClasses: 112,
        locations: ["Downtown"],
        isActive: false,
    },
]

export default function TrainersPage() {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredTrainers = MOCK_TRAINERS.filter(trainer =>
        trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white">Trainers</h2>
                    <p className="text-white/40 text-sm mt-1">
                        Manage trainers and their schedules
                    </p>
                </div>
                <button className="px-6 py-3 bg-white text-black font-bold text-sm tracking-wider hover:bg-white/90 transition-all flex items-center gap-2 w-fit">
                    <Plus className="w-4 h-4" />
                    ADD TRAINER
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                    type="text"
                    placeholder="Search trainers or specialties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-black border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                />
            </div>

            {/* Trainers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrainers.map((trainer, idx) => (
                    <motion.div
                        key={trainer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-black border p-6 hover:border-white/30 transition-colors ${trainer.isActive ? 'border-white/10' : 'border-white/5 opacity-60'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 bg-white/10">
                                    <AvatarFallback className="bg-transparent text-white font-bold text-lg">
                                        {trainer.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-white">{trainer.name}</h3>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-sm text-white/70">{trainer.rating}</span>
                                        <span className="text-white/30 mx-1">•</span>
                                        <span className="text-sm text-white/50">{trainer.experience} yrs</span>
                                    </div>
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
                                        Edit Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Specialties */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {trainer.specialties.map(specialty => (
                                <span
                                    key={specialty}
                                    className="px-2 py-1 bg-white/5 text-white/60 text-xs font-medium"
                                >
                                    {specialty}
                                </span>
                            ))}
                        </div>

                        {/* Contact */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-white/50 text-sm">
                                <Mail className="w-4 h-4" />
                                {trainer.email}
                            </div>
                            <div className="flex items-center gap-2 text-white/50 text-sm">
                                <Phone className="w-4 h-4" />
                                {trainer.phone}
                            </div>
                        </div>

                        {/* Locations */}
                        <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
                            <MapPin className="w-4 h-4" />
                            {trainer.locations.join(", ")}
                        </div>

                        {/* Stats */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-black text-white">{trainer.totalClasses}</p>
                                    <p className="text-xs text-white/40 tracking-wider uppercase">Classes Taught</p>
                                </div>
                                {!trainer.isActive && (
                                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold">
                                        INACTIVE
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
