"use client"

import { useClientAuthStore } from "@/lib/store/clientAuthStore"
import { motion } from "framer-motion"
import {
    User,
    Mail,
    CreditCard,
    Settings,
    LogOut,
    ChevronRight,
    Trophy,
    Target,
    Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
    const { clientUser, logoutClient } = useClientAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        logoutClient()
        router.push('/')
    }

    if (!clientUser) return null

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">My Profile</h1>
                <p className="text-[#5A6478] text-sm mt-1">
                    Manage your account details and preferences
                </p>
            </div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#131A2B] border border-[#1A2238] rounded-3xl p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-coral-400/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <Avatar className="h-24 w-24 border-4 border-[#0B0F19] ring-2 ring-[#1A2238]">
                        <AvatarImage src={clientUser.avatar} />
                        <AvatarFallback className="bg-[#F0F2F5]/10 text-white font-bold text-2xl">
                            {clientUser.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-1">{clientUser.name}</h2>
                        <div className="flex flex-col md:flex-row items-center gap-4 text-[#8892A4] text-sm">
                            <span className="flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                {clientUser.username}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3" />
                                {clientUser.email}
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="border-[#1A2238] text-white hover:bg-[#F0F2F5]/5 rounded-xl font-bold">
                        Edit Profile
                    </Button>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Classes", value: clientUser.stats.classesAttended, icon: Trophy, color: "text-yellow-400" },
                    { label: "Points", value: clientUser.stats.points, icon: Target, color: "text-purple-400" },
                    { label: "Current Streak", value: clientUser.stats.streak, icon: Trophy, color: "text-green-400" }
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + (idx * 0.05) }}
                        className="bg-[#131A2B] border border-[#1A2238] rounded-2xl p-4 text-center"
                    >
                        <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                        <p className="text-2xl font-black text-white">{stat.value}</p>
                        <p className="text-[10px] text-[#5A6478] uppercase tracking-widest">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Settings Sections */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#5A6478] uppercase tracking-wider pl-2">Account Settings</h3>

                <div className="bg-[#131A2B] border border-[#1A2238] rounded-2xl divide-y divide-[#1A2238] overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-[#F0F2F5]/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#F0F2F5]/5 rounded-lg text-[#F0F2F5]/70 group-hover:text-white group-hover:bg-[#F0F2F5]/10 transition-colors">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Membership Plan</p>
                                <p className="text-xs text-[#5A6478]">{clientUser.membership.type} • Expires {clientUser.membership.expiresAt}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#F0F2F5]/20 group-hover:text-[#F0F2F5]/60" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-[#F0F2F5]/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#F0F2F5]/5 rounded-lg text-[#F0F2F5]/70 group-hover:text-white group-hover:bg-[#F0F2F5]/10 transition-colors">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Notifications</p>
                                <p className="text-xs text-[#5A6478]">Manage push & email updates</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#F0F2F5]/20 group-hover:text-[#F0F2F5]/60" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-[#F0F2F5]/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#F0F2F5]/5 rounded-lg text-[#F0F2F5]/70 group-hover:text-white group-hover:bg-[#F0F2F5]/10 transition-colors">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">App Preferences</p>
                                <p className="text-xs text-[#5A6478]">Theme, language, accessibility</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#F0F2F5]/20 group-hover:text-[#F0F2F5]/60" />
                    </button>
                </div>
            </div>

            <Button
                onClick={handleLogout}
                className="w-full h-14 bg-[#F0F2F5]/5 hover:bg-red-500/10 text-white hover:text-red-400 border border-[#1A2238] font-bold rounded-2xl flex items-center justify-center gap-2 mt-8 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </Button>

            <p className="text-center text-xs text-[#5A6478] pt-4">
                FitConnect Pro v1.0.0
            </p>
        </div>
    )
}
