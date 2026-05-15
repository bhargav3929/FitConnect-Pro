"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Flame,
    Trophy,
    Calendar,
    ArrowRight,
    Clock,
    Star,
    Target,
    Award,
    Crown,
    Gem,
    Medal,
    Shield,
} from "lucide-react"
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore"
import { getUserBookings } from "@fitconnect/shared/firebase/firestore"
import { SubscriptionWidget } from "@/components/user/SubscriptionWidget"
import { Booking } from "@fitconnect/shared/types/booking"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TIER_COLORS, withAlpha, COLORS } from "@fitconnect/shared/theme"

// ═══════════ MILESTONE TIERS ═══════════
const TIERS = [
    { name: 'Bronze',   threshold: 0,   color: TIER_COLORS.bronze.color,   bg: withAlpha(TIER_COLORS.bronze.color,   TIER_COLORS.bronze.bgAlpha),   icon: Shield },
    { name: 'Silver',   threshold: 10,  color: TIER_COLORS.silver.color,   bg: withAlpha(TIER_COLORS.silver.color,   TIER_COLORS.silver.bgAlpha),   icon: Medal  },
    { name: 'Gold',     threshold: 25,  color: TIER_COLORS.gold.color,     bg: withAlpha(TIER_COLORS.gold.color,     TIER_COLORS.gold.bgAlpha),     icon: Award  },
    { name: 'Platinum', threshold: 50,  color: TIER_COLORS.platinum.color, bg: withAlpha(TIER_COLORS.platinum.color, TIER_COLORS.platinum.bgAlpha), icon: Crown  },
    { name: 'Diamond',  threshold: 100, color: TIER_COLORS.diamond.color,  bg: withAlpha(TIER_COLORS.diamond.color,  TIER_COLORS.diamond.bgAlpha),  icon: Gem    },
] as const

const TIER_INACTIVE_LINE = withAlpha(COLORS.olive[500], 0.08)
const TIER_INACTIVE_BG = withAlpha(COLORS.olive[500], 0.05)
const TIER_INACTIVE_ICON = withAlpha(COLORS.olive[500], 0.2)

function getMilestone(totalClasses: number) {
    let currentTierIdx = 0
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (totalClasses >= TIERS[i].threshold) {
            currentTierIdx = i
            break
        }
    }
    const currentTier = TIERS[currentTierIdx]
    const nextTier = TIERS[currentTierIdx + 1] || null
    const progress = nextTier
        ? ((totalClasses - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100
        : 100
    return { currentTier, currentTierIdx, nextTier, progress: Math.min(progress, 100) }
}

const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
}

export default function UserDashboard() {
    const clientUser = useClientAuthStore(state => state.clientUser)
    const firebaseUser = useClientAuthStore(state => state.firebaseUser)
    const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null)
    const [isLoadingBookings, setIsLoadingBookings] = useState(true)

    useEffect(() => {
        if (!firebaseUser) return

        getUserBookings(firebaseUser.uid).then((bookings) => {
            const upcoming = bookings.find(b => b.status === 'confirmed')
            setUpcomingBooking(upcoming || null)
            setIsLoadingBookings(false)
        }).catch(() => {
            setIsLoadingBookings(false)
        })
    }, [firebaseUser])

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        if (isToday) return `Today, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    // Skeleton loader
    if (!clientUser) {
        return (
            <div className="space-y-6 pb-20">
                <div className="rounded-2xl bg-gradient-to-br from-peach-300/60 via-peach-200 to-peach-100 p-8 md:p-10 animate-pulse">
                    <div className="h-4 w-24 bg-olive-400/10 rounded mb-2" />
                    <div className="h-10 w-48 bg-olive-400/10 rounded mb-8" />
                    <div className="flex gap-8 pt-6 border-t border-olive-400/5">
                        {[1, 2, 3].map(i => (
                            <div key={i}>
                                <div className="h-8 w-12 bg-olive-400/10 rounded mb-1" />
                                <div className="h-3 w-20 bg-olive-400/5 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-20 bg-peach-200/40 rounded-2xl animate-pulse" />
                <div className="h-28 bg-peach-200/40 rounded-2xl animate-pulse" />
                <div className="h-48 bg-peach-200/40 rounded-2xl animate-pulse" />
            </div>
        )
    }

    const streakPercentage = Math.min((clientUser.stats.currentStreak / 30) * 100, 100)

    return (
        <div className="space-y-6 pb-20">

            {/* ═══════════ WELCOME BANNER ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-peach-300 via-peach-200 to-peach-100 p-8 md:p-10"
            >
                {/* Decorative circles */}
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-terra-400/5" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-olive-400/5" />
                <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-terra-400/3" />

                <div className="relative z-10">
                    {/* Top row: Greeting + Streak */}
                    <div className="flex items-start justify-between mb-1">
                        <div>
                            <p className="text-olive-300 text-sm font-medium tracking-wide">{getGreeting()}</p>
                            <h1 className="text-3xl md:text-4xl font-black text-olive-600 tracking-normal font-display mt-1">
                                {clientUser.name.split(' ')[0]}
                            </h1>
                        </div>

                        {/* Streak Ring */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-[72px] h-[72px]">
                                {/* Background ring */}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                                    <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="4" className="text-olive-400/10" />
                                    <circle
                                        cx="36" cy="36" r="30" fill="none"
                                        stroke="currentColor" strokeWidth="4"
                                        strokeLinecap="round"
                                        className="text-terra-400"
                                        strokeDasharray={`${2 * Math.PI * 30}`}
                                        strokeDashoffset={`${2 * Math.PI * 30 * (1 - streakPercentage / 100)}`}
                                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <Flame className="w-4 h-4 text-terra-400 mb-0.5" />
                                    <span className="text-lg font-black text-olive-600 leading-none">{clientUser.stats.currentStreak}</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-olive-300 font-bold tracking-wider mt-1.5 uppercase">Streak</p>
                        </div>
                    </div>

                    {/* Stats row — integrated into the banner */}
                    <div className="flex items-center gap-6 md:gap-10 mt-8 pt-6 border-t border-olive-400/8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Trophy className="w-3.5 h-3.5 text-terra-400" />
                                <p className="text-2xl font-black text-olive-600 leading-none">{clientUser.stats.totalClassesAttended}</p>
                            </div>
                            <p className="text-[11px] text-olive-300 font-medium">Classes Attended</p>
                        </div>
                        <div className="w-px h-10 bg-olive-400/10" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Star className="w-3.5 h-3.5 text-terra-300" />
                                <p className="text-2xl font-black text-olive-600 leading-none">
                                    {clientUser.subscription.classesRemaining === null ? '∞' : clientUser.subscription.classesRemaining}
                                </p>
                            </div>
                            <p className="text-[11px] text-olive-300 font-medium">Classes Left</p>
                        </div>
                    </div>

                    {/* ═══════════ MILESTONE TIER ═══════════ */}
                    {(() => {
                        const { currentTier, currentTierIdx, nextTier, progress } = getMilestone(clientUser.stats.totalClassesAttended)
                        const TierIcon = currentTier.icon
                        return (
                            <div className="mt-6 pt-5 border-t border-olive-400/8">
                                {/* Tier badge + progress info */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: currentTier.bg }}
                                        >
                                            <TierIcon className="w-4 h-4" style={{ color: currentTier.color }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-olive-600 leading-none">
                                                {currentTier.name}
                                                <span className="text-[10px] text-olive-300 font-medium ml-1.5">Tier</span>
                                            </p>
                                            <p className="text-[10px] text-olive-300 mt-0.5">
                                                {nextTier
                                                    ? `${nextTier.threshold - clientUser.stats.totalClassesAttended} classes to ${nextTier.name}`
                                                    : 'Max tier reached!'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-olive-400">
                                        {clientUser.stats.totalClassesAttended}/{nextTier ? nextTier.threshold : currentTier.threshold}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="relative h-2 rounded-full bg-olive-400/8 overflow-hidden mb-3">
                                    <motion.div
                                        className="absolute inset-y-0 left-0 rounded-full"
                                        style={{ backgroundColor: currentTier.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                                    />
                                </div>

                                {/* Tier stepping stones */}
                                <div className="flex items-center justify-between">
                                    {TIERS.map((tier, idx) => {
                                        const Icon = tier.icon
                                        const isAchieved = idx <= currentTierIdx
                                        const isCurrent = idx === currentTierIdx
                                        return (
                                            <div key={tier.name} className="flex flex-col items-center gap-1 relative">
                                                {/* Connector line */}
                                                {idx > 0 && (
                                                    <div
                                                        className="absolute top-3 -left-full w-full h-[2px]"
                                                        style={{
                                                            backgroundColor: idx <= currentTierIdx
                                                                ? TIERS[idx - 1].color
                                                                : TIER_INACTIVE_LINE
                                                        }}
                                                    />
                                                )}
                                                <div
                                                    className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                        isCurrent ? 'ring-2 ring-offset-1 scale-110' : ''
                                                    }`}
                                                    style={{
                                                        backgroundColor: isAchieved ? tier.bg : TIER_INACTIVE_BG,
                                                        outlineColor: isCurrent ? tier.color : undefined,
                                                        borderColor: isCurrent ? tier.color : undefined,
                                                        ...(isCurrent ? { boxShadow: `0 0 8px ${tier.color}40` } : {}),
                                                    }}
                                                >
                                                    <Icon
                                                        className="w-3 h-3"
                                                        style={{
                                                            color: isAchieved ? tier.color : TIER_INACTIVE_ICON,
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    className={`text-[8px] font-bold tracking-wider uppercase ${
                                                        isAchieved ? 'text-olive-500' : 'text-olive-300/40'
                                                    }`}
                                                >
                                                    {tier.name}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })()}
                </div>
            </motion.div>

            {/* ═══════════ SUBSCRIPTION WIDGET ═══════════ */}
            <SubscriptionWidget subscription={clientUser.subscription} />

            {/* ═══════════ NEXT SESSION / BOOKING CTA ═══════════ */}
            {isLoadingBookings ? (
                <div className="h-28 bg-peach-200/40 rounded-2xl animate-pulse" />
            ) : upcomingBooking ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-terra-400 to-terra-300 p-6 md:p-8"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-peach-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-peach-50/15 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-peach-50 mb-3 tracking-wider">
                                <Clock className="w-3 h-3" />
                                UPCOMING SESSION
                            </div>
                            <h2 className="text-2xl font-black text-peach-50 mb-1">
                                {(upcomingBooking as Booking & { classType?: string }).classType || 'Pilates Class'}
                            </h2>
                            <p className="text-peach-50/70 text-sm font-medium">
                                {formatDate(upcomingBooking.classDate)} · Spot #{upcomingBooking.spotNumber}
                            </p>
                        </div>
                        <Link href="/user/bookings">
                            <Button className="bg-peach-50 text-terra-400 hover:bg-peach-100 font-bold px-6 h-11 rounded-xl transition-all hover:shadow-lg">
                                VIEW DETAILS
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="relative overflow-hidden rounded-2xl border border-peach-400/15 bg-peach-50 p-6 md:p-8"
                >
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-terra-400/5" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-olive-600">Your Next Move</h2>
                            <p className="text-olive-300 text-sm mt-1 max-w-md">
                                No upcoming sessions. Browse the schedule to find your perfect class.
                            </p>
                        </div>
                        <Link href="/user/schedule">
                            <Button className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold px-6 h-11 rounded-xl transition-all hover:shadow-lg hover:shadow-terra-400/20 flex items-center gap-2">
                                BROWSE SCHEDULE
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}


            {/* ═══════════ QUICK ACTIONS — ASYMMETRIC ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {/* Primary CTA — spans 2 columns, has gradient */}
                <Link href="/user/schedule" className="md:col-span-2 group">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-olive-600 to-olive-400 p-6 md:p-8 h-full transition-all hover:shadow-lg hover:shadow-olive-600/15">
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-peach-200/10" />
                        <div className="absolute top-4 right-4">
                            <div className="w-10 h-10 rounded-full bg-peach-200/10 flex items-center justify-center group-hover:bg-peach-200/20 transition-colors">
                                <ArrowRight className="w-5 h-5 text-peach-200/80 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                        <Calendar className="w-7 h-7 text-peach-200/60 mb-4" />
                        <h3 className="text-peach-50 font-bold text-lg">Book Your Next Class</h3>
                        <p className="text-peach-200/60 text-sm mt-1 max-w-sm">
                            Browse available sessions, pick your spot, and reserve your reformer.
                        </p>
                    </div>
                </Link>

                {/* Secondary CTA — 1 column, light */}
                <Link href="/user/bookings" className="group">
                    <div className="rounded-2xl border border-peach-400/15 bg-peach-50 p-6 h-full hover:border-terra-400/25 transition-all flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-terra-400/8 flex items-center justify-center mb-4 group-hover:bg-terra-400/15 transition-colors">
                            <Target className="w-5 h-5 text-terra-400" />
                        </div>
                        <h3 className="text-olive-600 font-bold">My Bookings</h3>
                        <p className="text-olive-300 text-xs mt-1 flex-1">Upcoming sessions and past history</p>
                        <div className="flex items-center gap-1 text-terra-400 text-xs font-bold mt-4 group-hover:gap-2 transition-all">
                            VIEW ALL <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </Link>
            </motion.div>
        </div>
    )
}
