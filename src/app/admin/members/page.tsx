"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    Mail,
    Calendar,
    Activity,
    Users,
    CreditCard,
    UserPlus,
    X,
    MapPin,
    Phone,
    ChevronRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { getAllMembers } from "@fitconnect/shared/firebase/firestore"
import { UserProfile } from "@fitconnect/shared/types/user"
import { toast } from "sonner"

const PLAN_FILTERS = ["All Plans", "unlimited", "twice_weekly", "once_weekly", "drop_in", "five_pack", "ten_pack"]
const STATUS_FILTERS = ["All Status", "active", "No Plan", "expired", "canceled"]
const PAGE_SIZE = 12

function getDateTime(date: Date | string | null | undefined): number {
    if (!date) return 0
    const d = typeof date === 'string' ? new Date(date) : date
    const time = d.getTime()
    return Number.isNaN(time) ? 0 : time
}

export default function MembersPage() {
    const [members, setMembers] = useState<UserProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [planFilter, setPlanFilter] = useState("All Plans")
    const [statusFilter, setStatusFilter] = useState("All Status")
    const [page, setPage] = useState(1)
    const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null)

    useEffect(() => {
        let cancelled = false

        getAllMembers()
            .then((items) => {
                if (cancelled) return
                setMembers(items.sort((a, b) => getDateTime(b.createdAt) - getDateTime(a.createdAt)))
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load members")
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    const filteredMembers = members.filter(member => {
        const name = member.name ?? ''
        const email = member.email ?? ''
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPlan = planFilter === "All Plans" || member.subscription?.planId === planFilter
        const matchesStatus =
            statusFilter === "All Status" ||
            (statusFilter === "No Plan" && !member.subscription?.planId) ||
            member.subscription?.status === statusFilter
        return matchesSearch && matchesPlan && matchesStatus
    })
    const totalMembers = members.length
    const totalFilteredMembers = filteredMembers.length
    const totalPages = Math.max(1, Math.ceil(totalFilteredMembers / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    )

    useEffect(() => {
        setPage(1)
    }, [searchQuery, planFilter, statusFilter])

    const activeCount = members.filter(m => m.subscription?.status === 'active').length
    const totalCredits = members.reduce((sum, m) => sum + (m.subscription?.classesRemaining ?? 0), 0)

    const getDisplayStatus = (member: UserProfile) => {
        if (!member.subscription?.planId && member.subscription?.status === 'expired') {
            return 'No Plan'
        }
        return member.subscription?.status
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-700 ring-1 ring-green-500/20'
            case 'expired': return 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20'
            case 'canceled': return 'bg-yellow-500/10 text-yellow-700 ring-1 ring-yellow-500/20'
            case 'No Plan': return 'bg-peach-300/40 text-olive-500 ring-1 ring-olive-400/15'
            default: return 'bg-peach-300/30 text-olive-400'
        }
    }

    const formatDate = (date: unknown) => {
        if (!date) return '--'
        let d: Date
        if (typeof date === 'string') {
            d = new Date(date)
        } else if (date instanceof Date) {
            d = date
        } else if (typeof (date as { toDate?: () => Date }).toDate === 'function') {
            d = (date as { toDate: () => Date }).toDate()
        } else {
            return '--'
        }
        return isNaN(d.getTime()) ? '--' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
                    <h2 className="app-page-title mb-2">
                        Members
                    </h2>
                    <p className="app-page-subtitle">
                        Manage member accounts, subscriptions, and class attendance across your studio.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {!isLoading && (
                        <>
                            <span className="text-olive-300 text-xs font-mono bg-peach-200/50 px-3 py-1.5 rounded-full border border-peach-400/20 flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                {totalMembers} total
                            </span>
                            <span className="text-olive-300 text-xs font-mono bg-green-500/8 px-3 py-1.5 rounded-full border border-green-500/15 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-green-600" />
                                {activeCount} active
                            </span>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Summary Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {[
                    { label: "Total Members", value: totalMembers, icon: Users },
                    { label: "Active", value: activeCount, icon: Activity },
                    { label: "Credits Remaining", value: totalCredits, icon: CreditCard },
                    { label: "New This Month", value: members.filter(m => {
                        if (!m.createdAt) return false
                        const d = typeof m.createdAt === 'string' ? new Date(m.createdAt) : m.createdAt
                        const now = new Date()
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                    }).length, icon: UserPlus },
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
                            <p className="app-stat-value">{stat.value.toLocaleString()}</p>
                        )}
                        <p className="app-stat-label mt-1">{stat.label}</p>
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
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-peach-50 border border-peach-400/20 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:outline-none focus:bg-peach-50 transition-all duration-300"
                    />
                </div>
                <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="h-12 px-4 bg-peach-50 border border-peach-400/20 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer capitalize hover:border-peach-400/40 transition-colors"
                >
                    {PLAN_FILTERS.map(plan => (
                        <option key={plan} value={plan} className="capitalize">{plan}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 px-4 bg-peach-50 border border-peach-400/20 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer capitalize hover:border-peach-400/40 transition-colors"
                >
                    {STATUS_FILTERS.map(status => (
                        <option key={status} value={status} className="capitalize">{status}</option>
                    ))}
                </select>
            </motion.div>

            {/* Loading State */}
            {isLoading && (
                <div className="bg-peach-50 border border-peach-400/20 overflow-hidden">
                    <div className="divide-y divide-peach-400/10">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="p-5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-peach-300/30 rounded-full" />
                                    <div className="flex-1">
                                        <div className="h-4 w-36 bg-peach-300/30 rounded mb-2" />
                                        <div className="h-3 w-48 bg-peach-200/50 rounded" />
                                    </div>
                                    <div className="hidden lg:flex items-center gap-8">
                                        <div className="h-5 w-16 bg-peach-200/50 rounded" />
                                        <div className="h-5 w-20 bg-peach-200/50 rounded" />
                                        <div className="h-5 w-24 bg-peach-200/50 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Members Table */}
            {!isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-peach-50 border border-peach-400/20 overflow-hidden"
                >
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-peach-400/15 bg-peach-200/30">
                                    <th className="text-left app-label p-4 pl-6">Member</th>
                                    <th className="text-left app-label p-4">Plan</th>
                                    <th className="text-left app-label p-4">Status</th>
                                    <th className="text-left app-label p-4">Joined</th>
                                    <th className="text-left app-label p-4">Credits</th>
                                    <th className="text-left app-label p-4">Classes</th>
                                    <th className="text-right app-label p-4 pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedMembers.map((member, idx) => (
                                    <motion.tr
                                        key={member.uid}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.35 + idx * 0.03 }}
                                        className="border-b border-peach-400/8 hover:bg-peach-100/80 transition-colors duration-200 group cursor-pointer"
                                        onClick={() => setSelectedMember(member)}
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 ring-2 ring-peach-400/10 group-hover:ring-terra-400/20 transition-all">
                                                    <AvatarImage src={member.profilePictureUrl} className="object-cover" />
                                                    <AvatarFallback className="bg-peach-200/60 text-olive-600 font-bold text-sm">
                                                        {(member.name ?? '?').split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-olive-600 text-sm">{member.name ?? 'Unknown'}</p>
                                                    <p className="text-xs text-olive-300 mt-0.5">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-olive-400 capitalize text-sm font-medium">{member.subscription.planId?.replace(/_/g, ' ') || 'None'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2.5 py-1 app-badge-text rounded-sm ${getStatusColor(getDisplayStatus(member))}`}>
                                                {getDisplayStatus(member)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-olive-300">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-sm">{formatDate(member.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-olive-600 font-black text-lg tracking-normal">
                                                {member.subscription?.classesRemaining === null ? '∞' : (member.subscription?.classesRemaining ?? '--')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3.5 h-3.5 text-olive-300" />
                                                <span className="app-body font-medium">{member.stats.totalClassesAttended}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <span className="inline-flex px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-terra-400 border border-terra-400/30 group-hover:bg-terra-400 group-hover:text-white transition-all duration-200">
                                                Details
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden divide-y divide-peach-400/10">
                        {paginatedMembers.map((member, idx) => (
                            <motion.div
                                key={member.uid}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + idx * 0.05 }}
                                className="p-4 hover:bg-peach-100/60 transition-colors relative cursor-pointer"
                                onClick={() => setSelectedMember(member)}
                            >
                                <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-transparent group-hover:bg-terra-400/30 transition-colors rounded-r" />
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 ring-2 ring-peach-400/10">
                                            <AvatarImage src={member.profilePictureUrl} className="object-cover" />
                                            <AvatarFallback className="bg-peach-200/60 text-olive-600 font-bold text-sm">
                                                {(member.name ?? '?').split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-olive-600 text-sm">{member.name ?? 'Unknown'}</p>
                                            <p className="text-xs text-olive-300 mt-0.5">{member.email}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex px-2 py-1 app-badge-text rounded-sm ${getStatusColor(getDisplayStatus(member))}`}>
                                        {getDisplayStatus(member)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm ml-[52px] mb-3">
                                    <div>
                                        <p className="app-stat-label mb-0.5">Plan</p>
                                        <p className="text-olive-400 font-medium capitalize">{member.subscription?.planId?.replace(/_/g, ' ') || 'None'}</p>
                                    </div>
                                    <div>
                                        <p className="app-stat-label mb-0.5">Classes</p>
                                        <p className="text-olive-400 font-medium">{member.stats.totalClassesAttended}</p>
                                    </div>
                                    <div>
                                        <p className="app-stat-label mb-0.5">Credits</p>
                                        <p className="text-olive-600 font-black">{member.subscription?.classesRemaining === null ? '∞' : (member.subscription?.classesRemaining ?? '--')}</p>
                                    </div>
                                </div>
                                <div className="ml-[52px]">
                                    <span className="inline-flex px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-terra-400 border border-terra-400/30">
                                        Details
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filteredMembers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-16 h-16 bg-peach-200/40 flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-olive-300/30" />
                            </div>
                            <p className="app-card-title mb-1">No members found</p>
                            <p className="app-body max-w-none">Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                    {filteredMembers.length > 0 && (
                        <PaginationControls
                            page={currentPage}
                            totalItems={totalFilteredMembers}
                            pageSize={PAGE_SIZE}
                            itemLabel="members"
                            onPageChange={setPage}
                        />
                    )}
                </motion.div>
            )}

            {/* Footer Summary */}
            {!isLoading && filteredMembers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between text-olive-300 text-xs tracking-wider"
                >
                    <span>
                        Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalFilteredMembers)} of {totalFilteredMembers} filtered members
                    </span>
                    <span className="font-mono bg-peach-200/30 px-3 py-1 rounded-full border border-peach-400/15">
                        {activeCount} active &bull; {members.length - activeCount} inactive
                    </span>
                </motion.div>
            )}

            {/* Member Detail Drawer */}
            <AnimatePresence>
                {selectedMember && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-olive-900/40 z-40"
                            onClick={() => setSelectedMember(null)}
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 280 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-peach-50 border-l border-peach-400/20 z-50 overflow-y-auto flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-peach-400/15 sticky top-0 bg-peach-50 z-10">
                                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">Member Profile</p>
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-terra-400 hover:bg-peach-200/50 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Identity */}
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 ring-2 ring-peach-400/15">
                                        <AvatarImage src={selectedMember.profilePictureUrl} className="object-cover" />
                                        <AvatarFallback className="bg-peach-200/60 text-olive-600 font-black text-lg">
                                            {(selectedMember.name ?? '?').split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-black text-olive-700 text-lg leading-tight">{selectedMember.name}</p>
                                        <p className="text-sm text-olive-300 mt-0.5">{selectedMember.email}</p>
                                        {selectedMember.isFoundingMember && (
                                            <span className="inline-flex mt-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20">
                                                Founding Member
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Subscription */}
                                <div className="bg-peach-100/60 border border-peach-400/15 p-4 space-y-3">
                                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">Subscription</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="app-stat-label mb-0.5">Plan</p>
                                            <p className="text-olive-600 font-semibold text-sm capitalize">{selectedMember.subscription.planId?.replace(/_/g, ' ') || 'None'}</p>
                                        </div>
                                        <div>
                                            <p className="app-stat-label mb-0.5">Status</p>
                                            <span className={`inline-flex px-2 py-0.5 app-badge-text rounded-sm ${getStatusColor(getDisplayStatus(selectedMember))}`}>
                                                {getDisplayStatus(selectedMember)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="app-stat-label mb-0.5">Credits</p>
                                            <p className="text-olive-600 font-black text-xl">
                                                {selectedMember.subscription?.classesRemaining === null ? '∞' : (selectedMember.subscription?.classesRemaining ?? '--')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="app-stat-label mb-0.5">Intro Credits</p>
                                            <p className="text-olive-600 font-black text-xl">{selectedMember.subscription?.introCreditRemaining ?? '--'}</p>
                                        </div>
                                        <div>
                                            <p className="app-stat-label mb-0.5">Joined</p>
                                            <div className="flex items-center gap-1.5 text-olive-400">
                                                <Calendar className="w-3 h-3" />
                                                <span className="text-sm">{formatDate(selectedMember.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="app-stat-label mb-0.5">Classes Attended</p>
                                            <div className="flex items-center gap-1.5 text-olive-400">
                                                <Activity className="w-3 h-3" />
                                                <span className="text-sm font-semibold">{selectedMember.stats.totalClassesAttended}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedMember.subscription?.endDate && (
                                        <div className="pt-2 border-t border-peach-400/15">
                                            <p className="app-stat-label mb-0.5">Plan Expires</p>
                                            <p className="text-sm text-olive-400">{formatDate(selectedMember.subscription?.endDate)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="bg-peach-100/60 border border-peach-400/15 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-3.5 h-3.5 text-terra-400" />
                                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">Address</p>
                                    </div>
                                    {selectedMember.address ? (
                                        <div className="space-y-0.5 text-sm text-olive-500">
                                            <p>{selectedMember.address.line1}</p>
                                            {selectedMember.address.line2 && <p>{selectedMember.address.line2}</p>}
                                            <p>{selectedMember.address.city}, {selectedMember.address.state} – {selectedMember.address.pincode}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-olive-300 italic">No address added</p>
                                    )}
                                </div>

                                {/* Emergency Contact */}
                                <div className="bg-peach-100/60 border border-peach-400/15 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Phone className="w-3.5 h-3.5 text-terra-400" />
                                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">Emergency Contact</p>
                                    </div>
                                    {selectedMember.emergencyContact ? (
                                        <div className="space-y-1 text-sm">
                                            <p className="font-semibold text-olive-600">{selectedMember.emergencyContact.name}</p>
                                            <p className="text-olive-400">{selectedMember.emergencyContact.relationship}</p>
                                            <a
                                                href={`tel:${selectedMember.emergencyContact.phone}`}
                                                className="flex items-center gap-1.5 text-terra-400 hover:text-terra-500 transition-colors mt-1"
                                            >
                                                <Phone className="w-3 h-3" />
                                                {selectedMember.emergencyContact.phone}
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-olive-300 italic">No emergency contact added</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <a
                                        href={`mailto:${selectedMember.email}`}
                                        className="flex-1 flex items-center justify-center gap-2 h-11 bg-terra-400 hover:bg-terra-500 text-white text-sm font-bold tracking-wide transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Send Email
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
