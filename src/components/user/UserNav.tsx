"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    House,
    CalendarDots,
    BookmarkSimple,
    UserCircle,
    SignOut,
    CaretRight,
    Crown,
} from "@phosphor-icons/react"
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore"
import { useRouter } from "next/navigation"

const NAV_ITEMS = [
    { label: "Home", href: "/user/dashboard", icon: House },
    { label: "Schedule", href: "/user/schedule", icon: CalendarDots },
    { label: "Bookings", href: "/user/bookings", icon: BookmarkSimple },
    { label: "Profile", href: "/user/profile", icon: UserCircle },
]

export function UserNav() {
    const pathname = usePathname()
    const router = useRouter()
    const clientUser = useClientAuthStore(state => state.clientUser)
    const logoutClient = useClientAuthStore(state => state.logoutClient)

    const handleLogout = async () => {
        await logoutClient()
        router.push('/')
    }

    const firstName = clientUser?.name?.split(' ')[0] || 'Member'
    const initials = clientUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'M'

    return (
        <>
            {/* ═══════════ DESKTOP SIDEBAR ═══════════ */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-warmDark-900 flex-col z-50">

                {/* Logo */}
                <div className="px-7 pt-8 pb-6">
                    <Image
                        src="/images/sol-logo-terra.png"
                        alt="SOL Pilates Studio"
                        width={400}
                        height={400}
                        className="h-16 w-auto"
                    />
                </div>

                {/* User card */}
                <div className="mx-5 mb-6 p-4 rounded-2xl bg-peach-200/5 border border-peach-200/8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terra-400 to-terra-300 flex items-center justify-center text-peach-50 text-sm font-bold flex-shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-peach-200 font-bold text-sm truncate">{firstName}</p>
                            <p className="text-peach-400/50 text-[11px] truncate">{clientUser?.subscription?.planId ? `${clientUser.subscription.planId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Plan` : 'Free Plan'}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1">
                    <p className="text-peach-400/30 text-[10px] font-bold tracking-[0.2em] uppercase px-3 mb-3">Menu</p>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                    isActive
                                        ? 'bg-terra-400 text-peach-50 shadow-lg shadow-terra-400/20'
                                        : 'text-peach-400/60 hover:text-peach-200 hover:bg-peach-200/5'
                                }`}
                            >
                                <item.icon
                                    weight={isActive ? "fill" : "regular"}
                                    className="w-[20px] h-[20px] flex-shrink-0"
                                />
                                <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                {isActive && (
                                    <CaretRight weight="bold" className="w-4 h-4 ml-auto opacity-60" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom */}
                <div className="px-4 pb-6 space-y-3">
                    {(!clientUser?.subscription?.planId || clientUser.subscription.planId === null) && (
                        <Link href="/user/subscribe" className="block mx-1">
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-terra-400/20 to-terra-300/10 border border-terra-400/15 p-4 group hover:border-terra-400/30 transition-all">
                                <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-terra-400/10" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <Crown weight="duotone" className="w-5 h-5 text-terra-400" />
                                    <div>
                                        <p className="text-peach-200 text-sm font-bold">Upgrade Plan</p>
                                        <p className="text-peach-400/50 text-[11px]">Unlock unlimited classes</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}

                    <div className="border-t border-peach-200/6 pt-3 mx-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-peach-400/40 hover:text-error-hover hover:bg-error-hover/10 transition-all duration-200"
                        >
                            <SignOut weight="regular" className="w-[18px] h-[18px]" />
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* ═══════════ MOBILE BOTTOM TAB BAR ═══════════ */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                {/* Glass bg */}
                <div className="absolute inset-0 bg-peach-50/80 backdrop-blur-2xl border-t border-peach-400/12" />

                <div className="relative flex items-center justify-around px-4 pt-1.5 pb-[max(env(safe-area-inset-bottom,6px),6px)]">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center py-1.5 min-w-[60px] relative"
                            >
                                {/* Active pill indicator at top */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-tab-pill"
                                            className="absolute -top-1.5 w-6 h-[3px] rounded-full bg-terra-400"
                                            initial={{ opacity: 0, scaleX: 0 }}
                                            animate={{ opacity: 1, scaleX: 1 }}
                                            exit={{ opacity: 0, scaleX: 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </AnimatePresence>

                                <motion.div
                                    whileTap={{ scale: 0.8 }}
                                    transition={{ duration: 0.08 }}
                                    className="flex flex-col items-center"
                                >
                                    <item.icon
                                        weight={isActive ? "fill" : "regular"}
                                        className={`w-[24px] h-[24px] transition-colors duration-150 ${
                                            isActive ? 'text-terra-400' : 'text-olive-300/35'
                                        }`}
                                    />
                                    <span className={`text-[10px] mt-1 transition-colors duration-150 ${
                                        isActive
                                            ? 'text-terra-400 font-bold'
                                            : 'text-olive-300/35 font-medium'
                                    }`}>
                                        {item.label}
                                    </span>
                                </motion.div>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* ═══════════ MOBILE TOP HEADER ═══════════ */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40">
                <div className="absolute inset-0 bg-peach-100/80 backdrop-blur-2xl border-b border-peach-400/10" />
                <div className="relative flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,12px),12px)] pb-3">
                    <Image
                        src="/images/sol-logo-terra.png"
                        alt="SOL Pilates Studio"
                        width={400}
                        height={400}
                        className="h-20 w-auto -my-4"
                    />
                    <Link href="/user/profile" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terra-400 to-terra-300 flex items-center justify-center text-peach-50 text-xs font-bold shadow-sm">
                            {initials}
                        </div>
                    </Link>
                </div>
            </header>
        </>
    )
}
