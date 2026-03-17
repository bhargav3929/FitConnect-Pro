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

    const handleLogout = async () => {
        await logoutClient()
        router.push('/')
    }

    if (!clientUser) {
        return (
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
                {/* Skeleton loader */}
                <div>
                    <div className="h-8 w-40 bg-peach-300/40 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-peach-200/60 rounded animate-pulse mt-2" />
                </div>
                <div className="bg-peach-50 border border-peach-400/20 p-8 animate-pulse">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-peach-300/40" />
                        <div className="space-y-3 flex-1">
                            <div className="h-6 w-48 bg-peach-300/40 rounded" />
                            <div className="h-4 w-64 bg-peach-200/60 rounded" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-peach-50 border border-peach-400/20 p-4 animate-pulse">
                            <div className="h-5 w-5 mx-auto mb-2 bg-peach-300/40 rounded" />
                            <div className="h-8 w-12 mx-auto bg-peach-300/40 rounded" />
                            <div className="h-3 w-16 mx-auto bg-peach-200/60 rounded mt-2" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-olive-600 tracking-tight font-display">My Profile</h1>
                <p className="text-olive-300 text-sm mt-1">
                    Manage your account details and preferences
                </p>
            </div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-peach-50 border border-peach-400/20 p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-terra-400/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <Avatar className="h-24 w-24 border-4 border-peach-100 ring-2 ring-peach-400/20">
                        <AvatarImage src={clientUser.avatar} />
                        <AvatarFallback className="bg-peach-200/50 text-olive-600 font-bold text-2xl">
                            {clientUser.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-olive-600 mb-1">{clientUser.name}</h2>
                        <div className="flex flex-col md:flex-row items-center gap-4 text-olive-300 text-sm">
                            <span className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3" />
                                {clientUser.email}
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="border-peach-400/20 text-olive-600 hover:bg-peach-200/50 rounded-xl font-bold">
                        Edit Profile
                    </Button>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Classes", value: clientUser.stats.totalClassesAttended, icon: Trophy, color: "text-terra-400" },
                    { label: "Longest Streak", value: clientUser.stats.longestStreak, icon: Target, color: "text-terra-400" },
                    { label: "Current Streak", value: clientUser.stats.currentStreak, icon: Trophy, color: "text-olive-400" }
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + (idx * 0.05) }}
                        className="bg-peach-50 border border-peach-400/20 p-4 text-center"
                    >
                        <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                        <p className="text-2xl font-black text-olive-600">{stat.value}</p>
                        <p className="text-[10px] text-olive-300 uppercase tracking-widest">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Settings Sections */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-olive-400 uppercase tracking-wider pl-2">Account Settings</h3>

                <div className="bg-peach-50 border border-peach-400/20 divide-y divide-peach-400/15 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-peach-100 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-peach-200/50 text-olive-400 group-hover:text-olive-600 group-hover:bg-peach-200/80 transition-colors">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-olive-600">Membership Plan</p>
                                <p className="text-xs text-olive-300">{clientUser.subscription.planType || 'No Plan'} {clientUser.subscription.endDate ? `• Expires ${new Date(clientUser.subscription.endDate).toLocaleDateString()}` : ''}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-olive-300/40 group-hover:text-olive-300" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-peach-100 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-peach-200/50 text-olive-400 group-hover:text-olive-600 group-hover:bg-peach-200/80 transition-colors">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-olive-600">Notifications</p>
                                <p className="text-xs text-olive-300">Manage push & email updates</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-olive-300/40 group-hover:text-olive-300" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-peach-100 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-peach-200/50 text-olive-400 group-hover:text-olive-600 group-hover:bg-peach-200/80 transition-colors">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-olive-600">App Preferences</p>
                                <p className="text-xs text-olive-300">Theme, language, accessibility</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-olive-300/40 group-hover:text-olive-300" />
                    </button>
                </div>
            </div>

            <Button
                onClick={handleLogout}
                className="w-full h-14 bg-red-500/10 hover:bg-red-500/15 text-red-600 border border-red-500/20 font-bold rounded-2xl flex items-center justify-center gap-2 mt-8 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </Button>

            <p className="text-center text-xs text-olive-300 pt-4">
                SOL Pilates v1.0.0
            </p>
        </div>
    )
}
