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
    Award,
    Clock,
    Users,
    Loader2,
    X,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAllTrainers, callCreateTrainer, callUpdateTrainer, callDeleteTrainer } from "@/lib/firebase/firestore"
import { Trainer } from "@/types/trainer"
import { toast } from "sonner"

interface TrainerFormData {
    name: string
    email: string
    phone: string
    bio: string
    specialties: string
    certifications: string
    experienceYears: number
    profilePictureUrl: string
    isActive: boolean
}

const defaultTrainerForm: TrainerFormData = {
    name: "",
    email: "",
    phone: "",
    bio: "",
    specialties: "",
    certifications: "",
    experienceYears: 0,
    profilePictureUrl: "",
    isActive: true,
}

export default function TrainersPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
    const [formData, setFormData] = useState<TrainerFormData>(defaultTrainerForm)
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        fetchTrainers()
    }, [])

    async function fetchTrainers() {
        try {
            const data = await getAllTrainers()
            setTrainers(data)
        } catch {
            toast.error("Failed to load trainers")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredTrainers = trainers.filter(trainer =>
        trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const activeTrainers = trainers.filter(t => t.isActive).length
    const ratedTrainers = trainers.filter(t => t.rating)
    const avgRating = ratedTrainers.length > 0
        ? (ratedTrainers.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTrainers.length).toFixed(1)
        : '—'
    const totalExperience = trainers.reduce((sum, t) => sum + (t.experienceYears || 0), 0)

    const openAddDialog = () => {
        setEditingTrainer(null)
        setFormData(defaultTrainerForm)
        setDialogOpen(true)
    }

    const openEditDialog = (trainer: Trainer) => {
        setEditingTrainer(trainer)
        setFormData({
            name: trainer.name,
            email: trainer.email,
            phone: trainer.phone || "",
            bio: trainer.bio || "",
            specialties: trainer.specialties.join(", "),
            certifications: trainer.certifications.join(", "),
            experienceYears: trainer.experienceYears || 0,
            profilePictureUrl: trainer.profilePictureUrl || "",
            isActive: trainer.isActive,
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Trainer name is required")
            return
        }
        if (!formData.email.trim()) {
            toast.error("Email is required")
            return
        }

        setIsSaving(true)
        try {
            const specialtiesArr = formData.specialties.split(",").map(s => s.trim()).filter(Boolean)
            const certificationsArr = formData.certifications.split(",").map(s => s.trim()).filter(Boolean)

            if (editingTrainer) {
                await callUpdateTrainer({
                    trainerId: editingTrainer.id,
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    bio: formData.bio.trim(),
                    specialties: specialtiesArr,
                    certifications: certificationsArr,
                    experienceYears: formData.experienceYears,
                    profilePictureUrl: formData.profilePictureUrl.trim(),
                    isActive: formData.isActive,
                })
                toast.success("Trainer updated")
            } else {
                await callCreateTrainer({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    bio: formData.bio.trim(),
                    specialties: specialtiesArr,
                    certifications: certificationsArr,
                    experienceYears: formData.experienceYears,
                    profilePictureUrl: formData.profilePictureUrl.trim(),
                })
                toast.success("Trainer added")
            }
            setDialogOpen(false)
            setIsLoading(true)
            await fetchTrainers()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save trainer"
            toast.error(message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (trainerId: string) => {
        setDeletingId(trainerId)
        try {
            await callDeleteTrainer(trainerId)
            setTrainers(prev => prev.filter(t => t.id !== trainerId))
            toast.success("Trainer removed")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to delete trainer"
            toast.error(message)
        } finally {
            setDeletingId(null)
        }
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
                    <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-tight mb-2 font-display">
                        Trainers
                    </h2>
                    <p className="text-olive-300 text-sm md:text-base tracking-wide max-w-lg">
                        Manage your team of fitness professionals, their specialties, and certifications.
                    </p>
                </div>
                <button
                    onClick={openAddDialog}
                    className="px-6 py-3.5 bg-terra-400 text-peach-50 font-bold text-xs tracking-[0.2em] uppercase hover:bg-terra-300 transition-all flex items-center gap-2.5 w-fit hover:shadow-lg hover:shadow-terra-400/15 active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    Add Trainer
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
                    { label: "Total Trainers", value: trainers.length, icon: Users },
                    { label: "Active", value: activeTrainers, icon: Award },
                    { label: "Avg Rating", value: avgRating, icon: Star },
                    { label: "Combined Yrs Exp", value: totalExperience, icon: Clock },
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
                            <p className="text-2xl font-black text-olive-600 tracking-tight">{stat.value}</p>
                        )}
                        <p className="text-[11px] text-olive-300 tracking-[0.15em] uppercase font-semibold mt-1">{stat.label}</p>
                    </div>
                ))}
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative max-w-lg group"
            >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300 group-focus-within:text-terra-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Search trainers or specialties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-peach-50 border border-peach-400/20 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:outline-none focus:bg-white transition-all duration-300"
                />
            </motion.div>

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-peach-50 border border-peach-400/20 p-6 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 bg-peach-300/30 rounded-full" />
                                <div>
                                    <div className="h-5 w-28 bg-peach-300/30 rounded mb-2" />
                                    <div className="h-3 w-20 bg-peach-200/50 rounded" />
                                </div>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <div className="h-7 w-16 bg-peach-200/50 rounded" />
                                <div className="h-7 w-20 bg-peach-200/50 rounded" />
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="h-3 w-full bg-peach-200/50 rounded" />
                                <div className="h-3 w-3/4 bg-peach-200/40 rounded" />
                            </div>
                            <div className="h-px bg-peach-400/10 my-4" />
                            <div className="flex gap-2">
                                <div className="h-5 w-20 bg-peach-200/40 rounded" />
                                <div className="h-5 w-24 bg-peach-200/40 rounded" />
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
                            transition={{ delay: 0.25 + idx * 0.08 }}
                            className={`group bg-peach-50 border p-6 hover:border-terra-400/30 hover:shadow-lg hover:shadow-terra-400/5 transition-all duration-500 ${trainer.isActive ? 'border-peach-400/20' : 'border-peach-400/10 opacity-60'
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 ring-2 ring-peach-400/10 group-hover:ring-terra-400/20 transition-all">
                                        <AvatarFallback className="bg-peach-200/60 text-olive-600 font-bold text-lg">
                                            {trainer.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-olive-600 group-hover:text-terra-500 transition-colors">{trainer.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {trainer.rating && (
                                                <>
                                                    <Star className="w-3.5 h-3.5 text-terra-400 fill-terra-400" />
                                                    <span className="text-sm text-olive-400 font-medium">{trainer.rating}</span>
                                                    <span className="text-olive-300/30 mx-0.5">&bull;</span>
                                                </>
                                            )}
                                            <span className="text-sm text-olive-300">{trainer.experienceYears} yrs exp</span>
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-olive-600 hover:bg-peach-200/50 rounded-md transition-all opacity-0 group-hover:opacity-100">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-peach-50/95 backdrop-blur-xl border-peach-400/15 shadow-xl shadow-black/5">
                                        <DropdownMenuItem
                                            className="text-olive-400 focus:bg-peach-200/50 focus:text-olive-600 cursor-pointer gap-2"
                                            onClick={() => openEditDialog(trainer)}
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer gap-2"
                                            onClick={() => handleDelete(trainer.id)}
                                            disabled={deletingId === trainer.id}
                                        >
                                            {deletingId === trainer.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
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
                                        className="px-2.5 py-1 bg-peach-200/40 text-olive-400 text-xs font-medium tracking-wide border border-peach-400/10"
                                    >
                                        {specialty}
                                    </span>
                                ))}
                            </div>

                            {/* Contact */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2.5 text-olive-300 text-sm">
                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{trainer.email}</span>
                                </div>
                                {trainer.phone && (
                                    <div className="flex items-center gap-2.5 text-olive-300 text-sm">
                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
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
                            <div className="pt-4 border-t border-peach-400/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-1.5">
                                        {trainer.certifications.slice(0, 2).map(cert => (
                                            <span key={cert} className="text-[10px] text-olive-300 bg-peach-200/40 px-2 py-0.5 tracking-wide border border-peach-400/8">
                                                {cert}
                                            </span>
                                        ))}
                                        {trainer.certifications.length > 2 && (
                                            <span className="text-[10px] text-olive-300/60 font-medium">
                                                +{trainer.certifications.length - 2} more
                                            </span>
                                        )}
                                    </div>
                                    {!trainer.isActive && (
                                        <span className="px-2.5 py-1 bg-red-500/10 text-red-600 text-[10px] font-bold tracking-wider ring-1 ring-red-500/20">
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
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-peach-200/40 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-olive-300/30" />
                    </div>
                    <p className="text-olive-600 font-bold mb-1">No trainers found</p>
                    <p className="text-olive-300 text-sm">Try adjusting your search criteria</p>
                </div>
            )}

            {/* Footer */}
            {!isLoading && filteredTrainers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between text-olive-300 text-xs tracking-wider"
                >
                    <span>Showing {filteredTrainers.length} of {trainers.length} trainers</span>
                    <span className="font-mono bg-peach-200/30 px-3 py-1 rounded-full border border-peach-400/15">
                        {activeTrainers} active &bull; {trainers.length - activeTrainers} inactive
                    </span>
                </motion.div>
            )}

            {/* ═══════════ ADD / EDIT TRAINER DIALOG ═══════════ */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-peach-50 border-peach-400/20 max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-olive-600">
                            {editingTrainer ? 'Edit Trainer' : 'Add New Trainer'}
                        </DialogTitle>
                        <DialogDescription className="text-olive-300 text-sm">
                            {editingTrainer
                                ? 'Update trainer profile details below.'
                                : 'Fill in the details to add a new trainer to the team.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 mt-2">
                        {/* Name + Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Jane Smith"
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:bg-white focus:outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="jane@solpilates.com"
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:bg-white focus:outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Phone + Experience */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="(212) 555-0100"
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:bg-white focus:outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                    Experience (years)
                                </label>
                                <input
                                    type="number"
                                    value={formData.experienceYears}
                                    onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                                    min={0}
                                    max={50}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Specialties */}
                        <div>
                            <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                Specialties (comma-separated)
                            </label>
                            <input
                                type="text"
                                value={formData.specialties}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                                placeholder="Reformer, Mat Pilates, Barre"
                                className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:bg-white focus:outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Certifications */}
                        <div>
                            <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                Certifications (comma-separated)
                            </label>
                            <input
                                type="text"
                                value={formData.certifications}
                                onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                                placeholder="PMA-CPT, NASM, ACE"
                                className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:bg-white focus:outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                Bio
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder="Brief bio about the trainer..."
                                rows={3}
                                className="w-full px-4 py-3 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:outline-none transition-all text-sm resize-none"
                            />
                        </div>

                        {/* Profile Picture URL */}
                        <div>
                            <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2">
                                Profile Picture URL (optional)
                            </label>
                            <input
                                type="url"
                                value={formData.profilePictureUrl}
                                onChange={(e) => setFormData(prev => ({ ...prev, profilePictureUrl: e.target.value }))}
                                placeholder="https://..."
                                className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:bg-white focus:outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Active toggle */}
                        {editingTrainer && (
                            <div className="flex items-center justify-between py-3 border-t border-peach-400/10">
                                <div>
                                    <p className="text-olive-600 font-medium text-sm">Active Status</p>
                                    <p className="text-olive-300 text-xs mt-0.5">Inactive trainers will not appear in scheduling</p>
                                </div>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                    className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${formData.isActive
                                        ? 'bg-terra-400 shadow-inner shadow-terra-500/20'
                                        : 'bg-peach-400/25'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${formData.isActive ? 'left-6' : 'left-1'}`}
                                    />
                                </button>
                            </div>
                        )}

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
                                {editingTrainer ? 'Update Trainer' : 'Add Trainer'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
