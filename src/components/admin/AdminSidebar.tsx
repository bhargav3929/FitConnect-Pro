"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutDashboard,
    CalendarDays,
    MapPin,
    Users,
    UserCircle,
    BookOpen,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    Dumbbell,
    X
} from "lucide-react"
import { useState } from "react"
import { useAdminAuthStore } from "@/lib/store/adminAuthStore"
import { useUIStore } from "@/lib/store/uiStore"
import { useRouter } from "next/navigation"

const NAV_ITEMS = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin/dashboard",
    },
    {
        label: "Classes",
        icon: CalendarDays,
        href: "/admin/classes",
    },
    {
        label: "Locations",
        icon: MapPin,
        href: "/admin/locations",
    },
    {
        label: "Trainers",
        icon: Users,
        href: "/admin/trainers",
    },
    {
        label: "Members",
        icon: UserCircle,
        href: "/admin/members",
    },
    {
        label: "Bookings",
        icon: BookOpen,
        href: "/admin/bookings",
    },
    {
        label: "Reports",
        icon: BarChart3,
        href: "/admin/reports",
    },
]

const BOTTOM_ITEMS = [
    {
        label: "Settings",
        icon: Settings,
        href: "/admin/settings",
    },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { logoutAdmin } = useAdminAuthStore()
    const { isSidebarOpen, setSidebarOpen } = useUIStore()
    const [collapsed, setCollapsed] = useState(false)

    const handleLogout = () => {
        logoutAdmin()
        router.push('/')
    }

    const sidebarContent = (
        <>
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#7BA3A8] to-[#5a7d82] rounded-xl flex items-center justify-center shadow-lg shadow-[#7BA3A8]/20 group-hover:scale-105 transition-transform duration-300">
                        <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="font-black text-lg text-white tracking-wider leading-none">FITPRO</span>
                            <span className="text-[10px] text-white/40 font-medium tracking-[0.2em]">ADMIN</span>
                        </div>
                    )}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex w-8 h-8 items-center justify-center text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                </button>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-none">
                <div className="px-3 mb-2">
                    {!collapsed && <p className="text-xs font-semibold text-white/20 tracking-widest uppercase">Overview</p>}
                </div>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-white/10 to-transparent text-white'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-[#7BA3A8]"
                                />
                            )}
                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-[#7BA3A8]' : ''}`} />
                            {!collapsed && (
                                <span className="text-sm font-medium tracking-wide">
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Section */}
            <div className="py-4 px-3 border-t border-white/5 space-y-1 relative">
                {/* Glass Reflection */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {BOTTOM_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && (
                                <span className="text-sm font-medium tracking-wide">
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    )
                })}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all group"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                    {!collapsed && (
                        <span className="text-sm font-medium tracking-wide">
                            Logout
                        </span>
                    )}
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`fixed left-0 top-0 bottom-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-r border-white/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hidden lg:flex flex-col ${collapsed ? 'w-20' : 'w-72'
                    }`}
            >
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-[#0A0A0A] border-r border-white/10 flex flex-col lg:hidden"
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
