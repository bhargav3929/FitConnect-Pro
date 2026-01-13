"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    Search,
    Filter,
    MoreVertical,
    Mail,
    Eye,
    UserX,
    Calendar,
    Activity,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

// Mock members data
const MOCK_MEMBERS = [
    {
        id: "1",
        name: "John Doe",
        email: "john.doe@email.com",
        plan: "Monthly",
        status: "active",
        joinDate: "2024-01-15",
        lastActive: "2 hours ago",
        classesAttended: 24,
    },
    {
        id: "2",
        name: "Jane Smith",
        email: "jane.smith@email.com",
        plan: "Quarterly",
        status: "active",
        joinDate: "2023-11-20",
        lastActive: "1 day ago",
        classesAttended: 45,
    },
    {
        id: "3",
        name: "Robert Johnson",
        email: "robert.j@email.com",
        plan: "Weekly",
        status: "expiring",
        joinDate: "2024-01-01",
        lastActive: "3 days ago",
        classesAttended: 8,
    },
    {
        id: "4",
        name: "Emily Davis",
        email: "emily.d@email.com",
        plan: "Monthly",
        status: "active",
        joinDate: "2023-12-10",
        lastActive: "5 hours ago",
        classesAttended: 32,
    },
    {
        id: "5",
        name: "Michael Brown",
        email: "michael.b@email.com",
        plan: "Monthly",
        status: "expired",
        joinDate: "2023-10-05",
        lastActive: "2 weeks ago",
        classesAttended: 15,
    },
    {
        id: "6",
        name: "Sarah Wilson",
        email: "sarah.w@email.com",
        plan: "Quarterly",
        status: "active",
        joinDate: "2023-09-15",
        lastActive: "Just now",
        classesAttended: 67,
    },
]

const PLAN_FILTERS = ["All Plans", "Weekly", "Monthly", "Quarterly"]
const STATUS_FILTERS = ["All Status", "active", "expiring", "expired"]

export default function MembersPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [planFilter, setPlanFilter] = useState("All Plans")
    const [statusFilter, setStatusFilter] = useState("All Status")

    const filteredMembers = MOCK_MEMBERS.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPlan = planFilter === "All Plans" || member.plan === planFilter
        const matchesStatus = statusFilter === "All Status" || member.status === statusFilter
        return matchesSearch && matchesPlan && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400'
            case 'expiring': return 'bg-yellow-500/20 text-yellow-400'
            case 'expired': return 'bg-red-500/20 text-red-400'
            default: return 'bg-white/10 text-white/60'
        }
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white">Members</h2>
                    <p className="text-white/40 text-sm mt-1">
                        View and manage member accounts
                    </p>
                </div>
                <div className="flex items-center gap-3 text-white/40 text-sm">
                    <span>{MOCK_MEMBERS.length} total members</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-black border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                    />
                </div>

                {/* Plan Filter */}
                <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="h-12 px-4 bg-black border border-white/10 text-white focus:border-white/30 focus:outline-none appearance-none cursor-pointer"
                >
                    {PLAN_FILTERS.map(plan => (
                        <option key={plan} value={plan}>{plan}</option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 px-4 bg-black border border-white/10 text-white focus:border-white/30 focus:outline-none appearance-none cursor-pointer capitalize"
                >
                    {STATUS_FILTERS.map(status => (
                        <option key={status} value={status} className="capitalize">{status}</option>
                    ))}
                </select>
            </div>

            {/* Members Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black border border-white/10 overflow-hidden"
            >
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left text-xs font-bold text-white/50 tracking-wider p-4">MEMBER</th>
                                <th className="text-left text-xs font-bold text-white/50 tracking-wider p-4">PLAN</th>
                                <th className="text-left text-xs font-bold text-white/50 tracking-wider p-4">STATUS</th>
                                <th className="text-left text-xs font-bold text-white/50 tracking-wider p-4">JOINED</th>
                                <th className="text-left text-xs font-bold text-white/50 tracking-wider p-4">LAST ACTIVE</th>
                                <th className="text-left text-xs font-bold text-white/50 tracking-wider p-4">CLASSES</th>
                                <th className="text-right text-xs font-bold text-white/50 tracking-wider p-4">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member) => (
                                <tr
                                    key={member.id}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 bg-white/10">
                                                <AvatarFallback className="bg-transparent text-white font-bold text-sm">
                                                    {member.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-white">{member.name}</p>
                                                <p className="text-xs text-white/40">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-white/80">{member.plan}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(member.status)}`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-white/60">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">{member.joinDate}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-white/60 text-sm">{member.lastActive}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-white/40" />
                                            <span className="text-white/80">{member.classesAttended}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-black border-white/10">
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={`/admin/members/${member.id}`}
                                                        className="text-white/70 focus:bg-white/10 focus:text-white cursor-pointer flex items-center"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Profile
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-white/70 focus:bg-white/10 focus:text-white cursor-pointer">
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Send Email
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer">
                                                    <UserX className="w-4 h-4 mr-2" />
                                                    Suspend Account
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
                <div className="lg:hidden divide-y divide-white/10">
                    {filteredMembers.map((member) => (
                        <div key={member.id} className="p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 bg-white/10">
                                        <AvatarFallback className="bg-transparent text-white font-bold text-sm">
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-white">{member.name}</p>
                                        <p className="text-xs text-white/40">{member.email}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold tracking-wider uppercase ${getStatusColor(member.status)}`}>
                                    {member.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm text-white/60">
                                <div>
                                    <p className="text-white/40 text-xs">Plan</p>
                                    <p>{member.plan}</p>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs">Classes</p>
                                    <p>{member.classesAttended}</p>
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs">Active</p>
                                    <p>{member.lastActive}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
