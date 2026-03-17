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
                    <div className="h-8 w-40 bg-sand-200/10 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-sand-200/5 rounded animate-pulse mt-2" />
                </div>
                <div className="bg-forest-800 border border-forest-600 rounded-3xl p-8 animate-pulse">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-sand-200/10" />
                        <div className="space-y-3 flex-1">
                            <div className="h-6 w-48 bg-sand-200/10 rounded" />
                            <div className="h-4 w-64 bg-sand-200/5 rounded" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-forest-800 border border-forest-600 rounded-2xl p-4 animate-pulse">
                            <div className="h-5 w-5 mx-auto mb-2 bg-sand-200/10 rounded" />
                            <div className="h-8 w-12 mx-auto bg-sand-200/10 rounded" />
                            <div className="h-3 w-16 mx-auto bg-sand-200/5 rounded mt-2" />
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
                <h1 className="text-3xl font-black text-sand-200 tracking-tight font-display">My Profile</h1>
                <p className="text-sage-500 text-sm mt-1">
                    Manage your account details and preferences
                </p>
            </div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-forest-800 border border-forest-600 rounded-3xl p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <Avatar className="h-24 w-24 border-4 border-forest-700 ring-2 ring-forest-600">
                        <AvatarImage src={clientUser.avatar} />
                        <AvatarFallback className="bg-sand-200/10 text-sand-200 font-bold text-2xl">
                            {clientUser.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-sand-200 mb-1">{clientUser.name}</h2>
                        <div className="flex flex-col md:flex-row items-center gap-4 text-sage-400 text-sm">
                            <span className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3" />
                                {clientUser.email}
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="border-forest-600 text-sand-200 hover:bg-sand-200/5 rounded-xl font-bold">
                        Edit Profile
                    </Button>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Classes", value: clientUser.stats.totalClassesAttended, icon: Trophy, color: "text-gold-400" },
                    { label: "Longest Streak", value: clientUser.stats.longestStreak, icon: Target, color: "text-terracotta-400" },
                    { label: "Current Streak", value: clientUser.stats.currentStreak, icon: Trophy, color: "text-sage-300" }
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + (idx * 0.05) }}
                        className="bg-forest-800 border border-forest-600 rounded-2xl p-4 text-center"
                    >
                        <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                        <p className="text-2xl font-black text-sand-200">{stat.value}</p>
                        <p className="text-[10px] text-sage-500 uppercase tracking-widest">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Settings Sections */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-sage-500 uppercase tracking-wider pl-2">Account Settings</h3>

                <div className="bg-forest-800 border border-forest-600 rounded-2xl divide-y divide-forest-600 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-sand-200/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-sand-200/5 rounded-lg text-sand-200/70 group-hover:text-sand-200 group-hover:bg-sand-200/10 transition-colors">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sand-200">Membership Plan</p>
                                <p className="text-xs text-sage-500">{clientUser.subscription.planType || 'No Plan'} {clientUser.subscription.endDate ? `• Expires ${new Date(clientUser.subscription.endDate).toLocaleDateString()}` : ''}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-sand-200/20 group-hover:text-sand-200/60" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-sand-200/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-sand-200/5 rounded-lg text-sand-200/70 group-hover:text-sand-200 group-hover:bg-sand-200/10 transition-colors">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sand-200">Notifications</p>
                                <p className="text-xs text-sage-500">Manage push & email updates</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-sand-200/20 group-hover:text-sand-200/60" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-sand-200/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-sand-200/5 rounded-lg text-sand-200/70 group-hover:text-sand-200 group-hover:bg-sand-200/10 transition-colors">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sand-200">App Preferences</p>
                                <p className="text-xs text-sage-500">Theme, language, accessibility</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-sand-200/20 group-hover:text-sand-200/60" />
                    </button>
                </div>
            </div>

            <Button
                onClick={handleLogout}
                className="w-full h-14 bg-sand-200/5 hover:bg-red-500/10 text-sand-200 hover:text-red-400 border border-forest-600 font-bold rounded-2xl flex items-center justify-center gap-2 mt-8 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </Button>

            <p className="text-center text-xs text-sage-500 pt-4">
                SOL Pilates v1.0.0
            </p>
        </div>
    )
}
