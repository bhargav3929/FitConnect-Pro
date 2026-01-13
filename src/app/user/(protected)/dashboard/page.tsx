"use client"

import { motion } from "framer-motion"
import {
    Flame,
    Trophy,
    Calendar,
    ArrowRight,
    MapPin,
    Dumbbell,
    Clock,
} from "lucide-react"
import { useClientAuthStore } from "@/lib/store/clientAuthStore"
import { CenterCard } from "@/components/user/CenterCard"
import Link from "next/link"

// Mock upcoming class
const UPCOMING_CLASS = {
    name: "HIIT Intensity",
    center: "FitPro Downtown",
    time: "Today, 6:00 PM",
    duration: "45 min",
    spot: "Spot 12"
}

// Mock nearby centers
const NEARBY_CENTERS = [
    {
        id: "1",
        name: "FitPro Downtown",
        address: "123 Main St, New York, NY",
        image: "/images/gyms/fitpro-downtown.png",
        rating: 4.9,
        distance: 0.8,
        openNow: true,
        nextClassTime: "In 30 mins"
    },
    {
        id: "2",
        name: "FitPro Midtown",
        address: "456 Park Ave, New York, NY",
        image: "/images/gyms/fitpro-midtown.png",
        rating: 4.8,
        distance: 1.2,
        openNow: true,
        nextClassTime: "In 1 hour"
    },
    {
        id: "3",
        name: "FitPro Uptown",
        address: "789 Broadway, New York, NY",
        image: "/images/gyms/fitpro-uptown.png",
        rating: 4.7,
        distance: 3.5,
        openNow: false,
        nextClassTime: "Tomorrow"
    }
]

export default function UserDashboard() {
    const user = useClientAuthStore(state => state.clientUser)

    if (!user) return null

    return (
        <div className="space-y-8 pb-20">
            {/* User Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Hello, {user.name.split(' ')[0]} 👋
                    </h1>
                    <p className="text-white/40 text-sm mt-1">
                        Ready for your workout today?
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-[#DFFF00]/10 border border-[#DFFF00]/20 px-4 py-2 rounded-full">
                    <Flame className="w-4 h-4 text-[#DFFF00]" />
                    <span className="text-[#DFFF00] font-bold text-sm">{user.stats.streak} Day Streak</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Classes Attended", value: user.stats.classesAttended, icon: Trophy, color: "text-yellow-400" },
                    { label: "Loyalty Points", value: user.stats.points, icon: StarIcon, color: "text-purple-400" },
                    { label: "Membership", value: user.membership.type, icon: CreditCardIcon, color: "text-green-400" },
                    { label: "Next Goal", value: "20 Classes", icon: TargetIcon, color: "text-blue-400" },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-[#0A0A0A] border border-white/10 p-4 rounded-2xl"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-white">{stat.value}</p>
                        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Upcoming Class Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7BA3A8] to-[#60868B] p-6 text-white"
            >
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-3">
                            <Clock className="w-3 h-3" />
                            UPCOMING CLASS
                        </div>
                        <h2 className="text-2xl font-black mb-1">{UPCOMING_CLASS.name}</h2>
                        <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {UPCOMING_CLASS.center}
                            </span>
                            <span className="w-1 h-1 bg-white/40 rounded-full" />
                            <span>{UPCOMING_CLASS.time}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-center bg-black/10 backdrop-blur-sm rounded-xl p-3 min-w-[80px]">
                            <p className="text-xs font-bold opacity-60 uppercase">Duration</p>
                            <p className="text-lg font-black">{UPCOMING_CLASS.duration}</p>
                        </div>
                        <Button className="bg-white text-black hover:bg-white/90 font-bold px-6 h-12 rounded-xl">
                            CHECK IN
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Nearby Centers */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Nearby Centers</h2>
                    <Link href="/user/centers" className="text-sm font-bold text-[#7BA3A8] hover:text-white transition-colors flex items-center gap-1">
                        VIEW ALL <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {NEARBY_CENTERS.map((center, idx) => (
                        <motion.div
                            key={center.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (idx * 0.1) }}
                        >
                            <CenterCard {...center} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Icons needed for stats
function StarIcon(props: any) { return <Star className={props.className} /> }
import { Star } from "lucide-react"

function CreditCardIcon(props: any) { return <div className={props.className}><Calendar className="w-5 h-5" /></div> }
function TargetIcon(props: any) { return <div className={props.className}><Dumbbell className="w-5 h-5" /></div> }

import { Button } from "@/components/ui/button"
