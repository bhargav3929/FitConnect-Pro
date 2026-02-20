"use client"

import Link from "next/link"
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

    const handleLogout = () => {
        logoutClient()
        router.push('/')
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#0B0F19] border-r border-[#1A2238] flex-col z-50">
                <div className="p-6 border-b border-[#1A2238] flex items-center gap-3">
                    <div className="w-8 h-8 bg-coral-400 flex items-center justify-center rounded-lg">
                        <Dumbbell className="w-4 h-4 text-[#0B0F19]" />
                    </div>
                    <span className="font-black text-white tracking-tighter text-lg">FITCONNECT</span>
                </div>

                <div className="flex-1 py-6 px-4 space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                        ? 'bg-coral-400 text-[#0B0F19] font-bold'
                                        : 'text-[#8892A4] hover:text-[#F0F2F5] hover:bg-[#F0F2F5]/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#0B0F19]' : 'text-[#8892A4] group-hover:text-[#F0F2F5]'}`} />
                                <span className={isActive ? 'font-bold' : 'font-medium'}>{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 w-1 h-8 bg-coral-400 rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-[#1A2238]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-[#0B0F19]/90 backdrop-blur-xl border-t border-[#1A2238] z-50 safe-area-bottom">
                <div className="flex justify-around items-center h-16 px-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-coral-400' : 'text-[#5A6478]'
                                    }`}
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={`p-1 rounded-lg ${isActive ? 'bg-coral-400/20' : 'bg-transparent'}`}
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
