"use client"

import Link from "next/link"
import Image from "next/image"
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
        label: "Facility",
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

    const handleLogout = async () => {
        await logoutAdmin()
        router.push('/')
    }

    const sidebarContent = (
        <>
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-peach-400/10">
                <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                    <Image
                        src="/images/sol-logo-gold.png"
                        alt="SOL Pilates Studio"
                        width={400}
                        height={400}
                        className={`${collapsed ? 'h-12 w-12 object-cover object-left' : 'h-20'} w-auto group-hover:opacity-80 transition-opacity duration-300`}
                    />
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex w-8 h-8 items-center justify-center text-peach-400/50 hover:text-peach-200 transition-colors hover:bg-peach-200/5 rounded-lg"
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                </button>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden w-8 h-8 flex items-center justify-center text-peach-400/50 hover:text-peach-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-none">
                <div className="px-3 mb-2">
                    {!collapsed && <p className="text-xs font-semibold text-peach-400/20 tracking-widest uppercase">Overview</p>}
                </div>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 transition-all group relative overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-peach-200/10 to-transparent text-peach-200'
                                : 'text-peach-400/60 hover:text-peach-200 hover:bg-peach-200/5'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-terra-400"
                                />
                            )}
                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-terra-400' : ''}`} />
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
            <div className="py-4 px-3 border-t border-peach-400/10 space-y-1 relative">
                {/* Glass Reflection */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-peach-200/5 to-transparent" />

                {BOTTOM_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 transition-all ${isActive
                                ? 'bg-peach-200/10 text-peach-200'
                                : 'text-peach-400/60 hover:text-peach-200 hover:bg-peach-200/5'
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
                    className="w-full flex items-center gap-3 px-3 py-3 text-[#A0453A]/60 hover:text-[#A0453A] hover:bg-[#A0453A]/10 transition-all group"
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
                className={`fixed left-0 top-0 bottom-0 z-40 bg-warmDark-900/95 backdrop-blur-xl border-r border-peach-400/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hidden lg:flex flex-col ${collapsed ? 'w-20' : 'w-72'
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
                            className="fixed inset-0 z-40 bg-warmDark-900/80 backdrop-blur-sm lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-warmDark-900 border-r border-peach-400/10 flex flex-col lg:hidden"
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
