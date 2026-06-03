"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Search,
    Mail,
    Calendar,
    Activity,
    Users,
    CreditCard,
    UserPlus,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PaginationControls } from "@/components/ui/pagination-controls"
import {
    getMembersPage,
    type FirestorePageCursor,
} from "@fitconnect/shared/firebase/firestore"
import { UserProfile } from "@fitconnect/shared/types/user"
import { toast } from "sonner"

const PLAN_FILTERS = ["All Plans", "unlimited", "twice_weekly", "once_weekly", "drop_in", "five_pack", "ten_pack"]
const STATUS_FILTERS = ["All Status", "active", "No Plan", "expired", "canceled"]
const PAGE_SIZE = 12

export default function MembersPage() {
    const [members, setMembers] = useState<UserProfile[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [planFilter, setPlanFilter] = useState("All Plans")
    const [statusFilter, setStatusFilter] = useState("All Status")
    const [requestedPage, setRequestedPage] = useState(1)
    const [pageCursors, setPageCursors] = useState<FirestorePageCursor[]>([null])
    const currentCursor = pageCursors[requestedPage - 1] || null

    useEffect(() => {
        let cancelled = false

        getMembersPage({
            pageSize: PAGE_SIZE,
            cursor: currentCursor,
            planId: planFilter === "All Plans" ? undefined : planFilter,
            status: statusFilter === "All Status" || statusFilter === "No Plan" ? undefined : statusFilter as UserProfile['subscription']['status'],
        })
            .then((pageResult) => {
                if (cancelled) return
                setMembers(pageResult.items)
                setTotalMembers(pageResult.total)
                setPageCursors(prev => {
                    const next = prev.slice(0, requestedPage)
                    next[requestedPage] = pageResult.nextCursor
                    return next
                })
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
    }, [requestedPage, currentCursor, planFilter, statusFilter])

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPlan = planFilter === "All Plans" || member.subscription.planId === planFilter
        const matchesStatus =
            statusFilter === "All Status" ||
            (statusFilter === "No Plan" && !member.subscription.planId) ||
            member.subscription.status === statusFilter
        return matchesSearch && matchesPlan && matchesStatus
    })
    const totalPages = Math.max(1, Math.ceil(totalMembers / PAGE_SIZE))
    const page = Math.min(requestedPage, totalPages)
    const paginatedMembers = filteredMembers

    const activeCount = members.filter(m => m.subscription.status === 'active').length
    const totalCredits = members.reduce((sum, m) => sum + (m.subscription.classesRemaining ?? 0), 0)

    const getDisplayStatus = (member: UserProfile) => {
        if (!member.subscription.planId && member.subscription.status === 'expired') {
            return 'No Plan'
        }
        return member.subscription.status
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

    const formatDate = (date: Date | string | null) => {
        if (!date) return '--'
        const d = typeof date === 'string' ? new Date(date) : date
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setRequestedPage(1)
                        }}
                        className="w-full h-12 pl-11 pr-4 bg-peach-50 border border-peach-400/20 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:outline-none focus:bg-peach-50 transition-all duration-300"
                    />
                </div>
                <select
                    value={planFilter}
                    onChange={(e) => {
                        setPlanFilter(e.target.value)
                        setRequestedPage(1)
                        setPageCursors([null])
                    }}
                    className="h-12 px-4 bg-peach-50 border border-peach-400/20 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer capitalize hover:border-peach-400/40 transition-colors"
                >
                    {PLAN_FILTERS.map(plan => (
                        <option key={plan} value={plan} className="capitalize">{plan}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setRequestedPage(1)
                        setPageCursors([null])
                    }}
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
                                        className="border-b border-peach-400/8 hover:bg-peach-100/80 transition-colors duration-200 group"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 ring-2 ring-peach-400/10 group-hover:ring-terra-400/20 transition-all">
                                                    <AvatarFallback className="bg-peach-200/60 text-olive-600 font-bold text-sm">
                                                        {member.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-olive-600 text-sm">{member.name}</p>
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
                                                {member.subscription.classesRemaining === null ? '∞' : member.subscription.classesRemaining}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3.5 h-3.5 text-olive-300" />
                                                <span className="app-body font-medium">{member.stats.totalClassesAttended}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <a
                                                href={`mailto:${member.email}`}
                                                className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-terra-400 hover:bg-peach-200/50 rounded-md transition-all"
                                                title="Send email"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </a>
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
                                className="p-4 hover:bg-peach-100/60 transition-colors relative"
                            >
                                <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-transparent group-hover:bg-terra-400/30 transition-colors rounded-r" />
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 ring-2 ring-peach-400/10">
                                            <AvatarFallback className="bg-peach-200/60 text-olive-600 font-bold text-sm">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-olive-600 text-sm">{member.name}</p>
                                            <p className="text-xs text-olive-300 mt-0.5">{member.email}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex px-2 py-1 app-badge-text rounded-sm ${getStatusColor(getDisplayStatus(member))}`}>
                                        {getDisplayStatus(member)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm ml-[52px]">
                                    <div>
                                        <p className="app-stat-label mb-0.5">Plan</p>
                                        <p className="text-olive-400 font-medium capitalize">{member.subscription.planId?.replace(/_/g, ' ') || 'None'}</p>
                                    </div>
                                    <div>
                                        <p className="app-stat-label mb-0.5">Classes</p>
                                        <p className="text-olive-400 font-medium">{member.stats.totalClassesAttended}</p>
                                    </div>
                                    <div>
                                        <p className="app-stat-label mb-0.5">Credits</p>
                                        <p className="text-olive-600 font-black">{member.subscription.classesRemaining === null ? '∞' : member.subscription.classesRemaining}</p>
                                    </div>
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
                            page={page}
                            totalItems={totalMembers}
                            pageSize={PAGE_SIZE}
                            itemLabel="members"
                            onPageChange={setRequestedPage}
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
                    <span>Showing page {page} of {Math.max(1, Math.ceil(totalMembers / PAGE_SIZE))} members</span>
                    <span className="font-mono bg-peach-200/30 px-3 py-1 rounded-full border border-peach-400/15">
                        {activeCount} active &bull; {members.length - activeCount} inactive
                    </span>
                </motion.div>
            )}
        </div>
    )
}
