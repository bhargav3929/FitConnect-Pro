"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Plus,
    Search,
    Star,
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
import { getTrainers } from "@/lib/firebase/firestore"
import { Trainer } from "@/types/trainer"
import { toast } from "sonner"

export default function TrainersPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        async function fetchTrainers() {
            try {
                const data = await getTrainers()
                setTrainers(data)
            } catch {
                toast.error("Failed to load trainers")
            } finally {
                setIsLoading(false)
            }
        }
        fetchTrainers()
    }, [])

    const filteredTrainers = trainers.filter(trainer =>
        trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-olive-600 font-display">Trainers</h2>
                    <p className="text-olive-300 text-sm mt-1">
                        Manage trainers and their schedules
                    </p>
                </div>
                <button className="px-6 py-3 bg-terra-400 text-peach-50 font-bold text-sm tracking-wider hover:bg-terra-300 transition-all flex items-center gap-2 w-fit">
                    <Plus className="w-4 h-4" />
                    ADD TRAINER
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300" />
                <input
                    type="text"
                    placeholder="Search trainers or specialties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-peach-50 border border-peach-400/20 text-olive-600 placeholder:text-olive-300/50 focus:border-terra-400 focus:outline-none"
                />
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-peach-50 border border-peach-400/20 p-6 animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-peach-300/40 rounded-full" />
                                <div>
                                    <div className="h-5 w-28 bg-peach-300/40 rounded mb-2" />
                                    <div className="h-3 w-20 bg-peach-200/60 rounded" />
                                </div>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <div className="h-6 w-16 bg-peach-200/60 rounded" />
                                <div className="h-6 w-20 bg-peach-200/60 rounded" />
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="h-4 w-full bg-peach-200/60 rounded" />
                                <div className="h-4 w-3/4 bg-peach-200/60 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Trainers Grid */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTrainers.map((trainer, idx) => (
                        <motion.div
                            key={trainer.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-peach-50 border p-6 hover:border-terra-400/30 transition-colors ${trainer.isActive ? 'border-peach-400/20' : 'border-peach-400/10 opacity-60'
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 bg-peach-200/60">
                                        <AvatarFallback className="bg-transparent text-olive-600 font-bold text-lg">
                                            {trainer.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-olive-600">{trainer.name}</h3>
                                        <div className="flex items-center gap-1 mt-1">
                                            {trainer.rating && (
                                                <>
                                                    <Star className="w-4 h-4 text-terra-400 fill-terra-400" />
                                                    <span className="text-sm text-olive-400">{trainer.rating}</span>
                                                    <span className="text-olive-300 mx-1">·</span>
                                                </>
                                            )}
                                            <span className="text-sm text-olive-300">{trainer.experienceYears} yrs</span>
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-olive-600 transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-peach-50 border-peach-400/20">
                                        <DropdownMenuItem className="text-olive-400 focus:bg-peach-200/50 focus:text-olive-600 cursor-pointer">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer">
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
                                        className="px-2 py-1 bg-peach-200/50 text-olive-400 text-xs font-medium"
                                    >
                                        {specialty}
                                    </span>
                                ))}
                            </div>

                            {/* Contact */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-olive-300 text-sm">
                                    <Mail className="w-4 h-4" />
                                    {trainer.email}
                                </div>
                                {trainer.phone && (
                                    <div className="flex items-center gap-2 text-olive-300 text-sm">
                                        <Phone className="w-4 h-4" />
                                        {trainer.phone}
                                    </div>
                                )}
                            </div>

                            {/* Bio */}
                            {trainer.bio && (
                                <p className="text-olive-300 text-xs leading-relaxed mb-4 line-clamp-2">
                                    {trainer.bio}
                                </p>
                            )}

                            {/* Footer */}
                            <div className="pt-4 border-t border-peach-400/15">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-1">
                                        {trainer.certifications.slice(0, 2).map(cert => (
                                            <span key={cert} className="text-[10px] text-olive-300 bg-peach-200/50 px-2 py-0.5">
                                                {cert}
                                            </span>
                                        ))}
                                        {trainer.certifications.length > 2 && (
                                            <span className="text-[10px] text-olive-300">
                                                +{trainer.certifications.length - 2}
                                            </span>
                                        )}
                                    </div>
                                    {!trainer.isActive && (
                                        <span className="px-2 py-1 bg-red-500/15 text-red-600 text-xs font-bold">
                                            INACTIVE
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {!isLoading && filteredTrainers.length === 0 && (
                <div className="text-center py-12">
                    <Star className="w-8 h-8 text-olive-300/30 mx-auto mb-3" />
                    <p className="text-olive-300 text-sm">No trainers found</p>
                </div>
            )}
        </div>
    )
}
