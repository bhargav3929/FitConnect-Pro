"use client"

import { useClientAuthStore } from "@/lib/store/clientAuthStore"
import { motion } from "framer-motion"
import {
    Mail,
    CreditCard,
    Settings,
    LogOut,
    ChevronRight,
    Flame,
    Trophy,
    Target,
    Bell,
    HelpCircle,
    Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function ProfilePage() {
    const { clientUser, logoutClient } = useClientAuthStore()
    const router = useRouter()

    const handleLogout = async () => {
        await logoutClient()
        router.push('/')
    }

    if (!clientUser) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 pb-24">
                <div className="rounded-2xl bg-gradient-to-br from-peach-300/60 via-peach-200 to-peach-100 p-8 animate-pulse">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-full bg-olive-400/10" />
                        <div className="flex-1 space-y-2">
                            <div className="h-6 w-40 bg-olive-400/10 rounded" />
                            <div className="h-4 w-56 bg-olive-400/5 rounded" />
                        </div>
                    </div>
                </div>
                <div className="h-48 bg-peach-200/40 rounded-2xl animate-pulse" />
            </div>
        )
    }

    const initials = clientUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">

            {/* ═══════════ PROFILE HERO CARD ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-peach-300 via-peach-200 to-peach-100 p-6 md:p-8"
            >
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-terra-400/5" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-olive-400/5" />

                <div className="relative z-10">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-5 mb-6">
                        <Avatar className="h-20 w-20 border-4 border-peach-50 shadow-lg">
                            <AvatarImage src={clientUser.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-terra-400 to-terra-300 text-peach-50 font-bold text-xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-black text-olive-600 tracking-tight font-display truncate">{clientUser.name}</h1>
                            <p className="text-olive-300 text-sm flex items-center gap-1.5 mt-0.5 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                {clientUser.email}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-terra-400/10 text-terra-400 text-[11px] font-bold">
                                    {clientUser.subscription.planId ? `${clientUser.subscription.planId.replace(/_/g, ' ')} Plan` : 'Free Plan'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row — inline, not separate cards */}
                    <div className="flex items-center gap-0 bg-peach-50/60 rounded-xl divide-x divide-olive-400/8 overflow-hidden">
                        <div className="flex-1 py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Trophy className="w-3.5 h-3.5 text-terra-400" />
                                <span className="text-xl font-black text-olive-600 leading-none">{clientUser.stats.totalClassesAttended}</span>
                            </div>
                            <p className="text-[10px] text-olive-300 font-medium uppercase tracking-wider">Classes</p>
                        </div>
                        <div className="flex-1 py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Target className="w-3.5 h-3.5 text-terra-300" />
                                <span className="text-xl font-black text-olive-600 leading-none">{clientUser.stats.longestStreak}</span>
                            </div>
                            <p className="text-[10px] text-olive-300 font-medium uppercase tracking-wider">Best Streak</p>
                        </div>
                        <div className="flex-1 py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Flame className="w-3.5 h-3.5 text-terra-400" />
                                <span className="text-xl font-black text-olive-600 leading-none">{clientUser.stats.currentStreak}</span>
                            </div>
                            <p className="text-[10px] text-olive-300 font-medium uppercase tracking-wider">Streak</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══════════ QUICK ACTIONS ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-3"
            >
                <Link href="/user/schedule">
                    <div className="bg-peach-50 border border-peach-400/15 rounded-2xl p-4 hover:border-terra-400/25 transition-all group text-center">
                        <div className="w-10 h-10 rounded-xl bg-terra-400/8 flex items-center justify-center mx-auto mb-2 group-hover:bg-terra-400/15 transition-colors">
                            <Trophy className="w-5 h-5 text-terra-400" />
                        </div>
                        <p className="text-olive-600 text-sm font-bold">Book a Class</p>
                        <p className="text-olive-300 text-[11px] mt-0.5">Browse schedule</p>
                    </div>
                </Link>
                <Link href="/user/subscribe">
                    <div className="bg-peach-50 border border-peach-400/15 rounded-2xl p-4 hover:border-terra-400/25 transition-all group text-center">
                        <div className="w-10 h-10 rounded-xl bg-olive-400/8 flex items-center justify-center mx-auto mb-2 group-hover:bg-olive-400/15 transition-colors">
                            <CreditCard className="w-5 h-5 text-olive-400" />
                        </div>
                        <p className="text-olive-600 text-sm font-bold">Manage Plan</p>
                        <p className="text-olive-300 text-[11px] mt-0.5">View pricing</p>
                    </div>
                </Link>
            </motion.div>

            {/* ═══════════ SETTINGS LIST (iOS-style) ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <p className="text-[10px] font-bold text-olive-300 uppercase tracking-[0.2em] px-1 mb-3">Account</p>
                <div className="bg-peach-50 border border-peach-400/15 rounded-2xl divide-y divide-peach-400/10 overflow-hidden">
                    {[
                        { icon: CreditCard, label: "Membership Plan", sub: clientUser.subscription.planId ? `${clientUser.subscription.planId.replace(/_/g, ' ')} Plan` : 'No active plan', color: "text-terra-400", bg: "bg-terra-400/8" },
                        { icon: Bell, label: "Notifications", sub: "Push & email preferences", color: "text-olive-400", bg: "bg-olive-400/8" },
                        { icon: Shield, label: "Privacy & Security", sub: "Password, data, permissions", color: "text-olive-400", bg: "bg-olive-400/8" },
                        { icon: Settings, label: "Preferences", sub: "Theme, language, accessibility", color: "text-olive-400", bg: "bg-olive-400/8" },
                    ].map((item) => (
                        <button key={item.label} className="w-full flex items-center gap-4 p-4 hover:bg-peach-100/60 transition-colors group active:bg-peach-200/50">
                            <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 ${item.color}`}>
                                <item.icon className="w-[18px] h-[18px]" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-olive-600 font-semibold text-sm">{item.label}</p>
                                <p className="text-olive-300 text-xs truncate">{item.sub}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-olive-300/30 group-hover:text-olive-300/60 flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* ═══════════ SUPPORT ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <p className="text-[10px] font-bold text-olive-300 uppercase tracking-[0.2em] px-1 mb-3">Support</p>
                <div className="bg-peach-50 border border-peach-400/15 rounded-2xl divide-y divide-peach-400/10 overflow-hidden">
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-peach-100/60 transition-colors group active:bg-peach-200/50">
                        <div className="w-9 h-9 rounded-xl bg-olive-400/8 flex items-center justify-center flex-shrink-0 text-olive-400">
                            <HelpCircle className="w-[18px] h-[18px]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-olive-600 font-semibold text-sm">Help & FAQ</p>
                            <p className="text-olive-300 text-xs">Get answers to common questions</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-olive-300/30 group-hover:text-olive-300/60" />
                    </button>
                </div>
            </motion.div>

            {/* ═══════════ SIGN OUT ═══════════ */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
            >
                <Button
                    onClick={handleLogout}
                    className="w-full h-13 bg-transparent hover:bg-red-500/8 text-red-500/70 hover:text-red-500 border border-red-500/15 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
                <p className="text-center text-[10px] text-olive-300/50 mt-4 tracking-wider">
                    SOL PILATES STUDIO · v1.0.0
                </p>
            </motion.div>
        </div>
    )
}
