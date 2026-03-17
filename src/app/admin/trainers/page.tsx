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
                    <h2 className="text-2xl font-black text-sand-200 font-display">Trainers</h2>
                    <p className="text-sage-500 text-sm mt-1">
                        Manage trainers and their schedules
                    </p>
                </div>
                <button className="px-6 py-3 bg-gold-400 text-forest-700 font-bold text-sm tracking-wider hover:bg-gold-300 transition-all flex items-center gap-2 w-fit">
                    <Plus className="w-4 h-4" />
                    ADD TRAINER
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-500" />
                <input
                    type="text"
                    placeholder="Search trainers or specialties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-forest-700 border border-forest-600 text-sand-200 placeholder:text-sage-500 focus:border-gold-400/50 focus:outline-none"
                />
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-forest-700 border border-forest-600 p-6 animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-sand-200/5 rounded-full" />
                                <div>
                                    <div className="h-5 w-28 bg-sand-200/10 rounded mb-2" />
                                    <div className="h-3 w-20 bg-sand-200/5 rounded" />
                                </div>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <div className="h-6 w-16 bg-sand-200/5 rounded" />
                                <div className="h-6 w-20 bg-sand-200/5 rounded" />
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="h-4 w-full bg-sand-200/5 rounded" />
                                <div className="h-4 w-3/4 bg-sand-200/5 rounded" />
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
                            className={`bg-forest-700 border p-6 hover:border-gold-400/30 transition-colors ${trainer.isActive ? 'border-forest-600' : 'border-forest-600/50 opacity-60'
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 bg-sand-200/10">
                                        <AvatarFallback className="bg-transparent text-sand-200 font-bold text-lg">
                                            {trainer.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-sand-200">{trainer.name}</h3>
                                        <div className="flex items-center gap-1 mt-1">
                                            {trainer.rating && (
                                                <>
                                                    <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                                                    <span className="text-sm text-sand-200/70">{trainer.rating}</span>
                                                    <span className="text-sage-500 mx-1">·</span>
                                                </>
                                            )}
                                            <span className="text-sm text-sage-400">{trainer.experienceYears} yrs</span>
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-8 h-8 flex items-center justify-center text-sage-500 hover:text-sand-200 transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-forest-700 border-forest-600">
                                        <DropdownMenuItem className="text-sand-200/70 focus:bg-sand-200/10 focus:text-sand-200 cursor-pointer">
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
                                        className="px-2 py-1 bg-sand-200/5 text-sage-400 text-xs font-medium"
                                    >
                                        {specialty}
                                    </span>
                                ))}
                            </div>

                            {/* Contact */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sage-400 text-sm">
                                    <Mail className="w-4 h-4" />
                                    {trainer.email}
                                </div>
                                {trainer.phone && (
                                    <div className="flex items-center gap-2 text-sage-400 text-sm">
                                        <Phone className="w-4 h-4" />
                                        {trainer.phone}
                                    </div>
                                )}
                            </div>

                            {/* Bio */}
                            {trainer.bio && (
                                <p className="text-sage-500 text-xs leading-relaxed mb-4 line-clamp-2">
                                    {trainer.bio}
                                </p>
                            )}

                            {/* Footer */}
                            <div className="pt-4 border-t border-forest-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-1">
                                        {trainer.certifications.slice(0, 2).map(cert => (
                                            <span key={cert} className="text-[10px] text-sage-500 bg-sand-200/5 px-2 py-0.5">
                                                {cert}
                                            </span>
                                        ))}
                                        {trainer.certifications.length > 2 && (
                                            <span className="text-[10px] text-sage-500">
                                                +{trainer.certifications.length - 2}
                                            </span>
                                        )}
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
            )}

            {!isLoading && filteredTrainers.length === 0 && (
                <div className="text-center py-12">
                    <Star className="w-8 h-8 text-sand-200/20 mx-auto mb-3" />
                    <p className="text-sage-500 text-sm">No trainers found</p>
                </div>
            )}
        </div>
    )
}
