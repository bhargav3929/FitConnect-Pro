"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
    LayoutDashboard,
    Map,
    Calendar,
    User,
    LogOut,
    Dumbbell
} from "lucide-react"
import { useClientAuthStore } from "@/lib/store/clientAuthStore"
import { useRouter } from "next/navigation"

const NAV_ITEMS = [
    { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { label: "Schedule", href: "/user/schedule", icon: Calendar },
    { label: "My Bookings", href: "/user/bookings", icon: Map },
    { label: "Profile", href: "/user/profile", icon: User },
]

export function UserNav() {
    const pathname = usePathname()
    const router = useRouter()
    const logoutClient = useClientAuthStore(state => state.logoutClient)

    const handleLogout = async () => {
        await logoutClient()
        router.push('/')
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-warmDark-900 border-r border-peach-400/10 flex-col z-50">
                <div className="p-6 border-b border-peach-400/10 flex items-center">
                    <Image
                        src="/images/sol-logo-gold.png"
                        alt="SOL Pilates Studio"
                        width={400}
                        height={400}
                        className="h-20 w-auto"
                    />
                </div>

                <div className="flex-1 py-6 px-4 space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 transition-all group ${isActive
                                        ? 'bg-terra-400 text-peach-50 font-bold'
                                        : 'text-peach-400 hover:text-peach-200 hover:bg-peach-200/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-peach-50' : 'text-peach-400 group-hover:text-peach-200'}`} />
                                <span className={isActive ? 'font-bold' : 'font-medium'}>{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 w-1 h-8 bg-terra-400 rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-peach-400/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[#A0453A] hover:bg-[#A0453A]/10 transition-colors font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-warmDark-900/90 backdrop-blur-xl border-t border-peach-400/10 z-50 safe-area-bottom">
                <div className="flex justify-around items-center h-16 px-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-terra-400' : 'text-peach-400/50'
                                    }`}
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={`p-1 rounded-lg ${isActive ? 'bg-terra-400/20' : 'bg-transparent'}`}
                                >
                                    <item.icon className="w-5 h-5" />
                                </motion.div>
                                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
