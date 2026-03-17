"use client"

import { usePathname } from "next/navigation"
import { Bell, Search, Menu, ChevronDown, Monitor, Clock, Settings, LogOut } from "lucide-react"
import { useAdminAuthStore } from "@/lib/store/adminAuthStore"
import { useUIStore } from "@/lib/store/uiStore"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

const PAGE_TITLES: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/classes': 'Class Management',
    '/admin/locations': 'Facility Settings',
    '/admin/trainers': 'Trainer Management',
    '/admin/members': 'Member Management',
    '/admin/bookings': 'Bookings',
    '/admin/reports': 'Reports & Analytics',
    '/admin/settings': 'Settings',
}

export function AdminHeader() {
    const pathname = usePathname()
    const router = useRouter()
    const { adminUser, logoutAdmin } = useAdminAuthStore()
    const { toggleSidebar } = useUIStore()

    const pageTitle = PAGE_TITLES[pathname] || 'Admin'

    const handleLogout = async () => {
        await logoutAdmin()
        router.push('/')
    }

    return (
        <header className="h-20 border-b border-peach-400/10 bg-warmDark-800/50 backdrop-blur-xl sticky top-0 z-30 transition-all duration-300">
            <div className="h-full px-4 lg:px-8 flex items-center justify-between">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    {/* Mobile menu button */}
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden w-10 h-10 flex items-center justify-center text-peach-200/80 hover:text-peach-200 transition-colors rounded-lg active:bg-peach-200/5"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Page Title & Breadcrumb-ish */}
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-peach-200 tracking-tight flex items-center gap-2">
                            {pageTitle}
                            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-terra-400" />
                        </h1>
                        <p className="text-peach-400/50 text-[10px] tracking-[0.2em] uppercase hidden sm:block">
                            SOL Administration
                        </p>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Search - Desktop */}
                    <div className="hidden md:flex items-center relative group">
                        <Search className="w-4 h-4 text-peach-400/50 absolute left-3 hover:text-peach-200 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="bg-peach-200/5 border border-peach-400/10 rounded-full pl-10 pr-4 py-2 text-sm text-peach-200 placeholder:text-peach-400/40 hover:bg-peach-200/10 focus:bg-peach-200/10 focus:border-terra-400/50 focus:outline-none transition-all w-64"
                        />
                    </div>

                    {/* Notifications */}
                    <button className="relative w-10 h-10 flex items-center justify-center text-peach-400 hover:text-peach-200 hover:bg-peach-200/5 rounded-full transition-all group">
                        <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-terra-400 rounded-full ring-2 ring-warmDark-800" />
                    </button>

                    <div className="w-px h-8 bg-peach-400/10 hidden sm:block" />

                    {/* Profile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 pl-2 pr-2 py-1.5 rounded-full hover:bg-peach-200/5 border border-transparent hover:border-peach-400/10 transition-all">
                                <Avatar className="h-8 w-8 ring-2 ring-peach-400/10">
                                    <AvatarFallback className="bg-gradient-to-br from-terra-400 to-terra-500 text-peach-50 font-bold text-xs">
                                        {adminUser?.name?.charAt(0) || 'A'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:flex flex-col items-start">
                                    <p className="text-sm font-semibold text-peach-200 leading-none">
                                        {adminUser?.name || 'Admin'}
                                    </p>
                                    <p className="text-[10px] text-peach-400 leading-none mt-1">
                                        Super Admin
                                    </p>
                                </div>
                                <ChevronDown className="w-3 h-3 text-peach-400/50 hidden md:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-64 bg-warmDark-700/95 backdrop-blur-xl border-peach-400/10 shadow-2xl shadow-black/50 text-peach-200 p-1"
                        >
                            <div className="px-2 py-3 bg-peach-200/5 rounded-md mb-1 flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-1 ring-peach-400/20">
                                    <AvatarFallback className="bg-terra-400 text-peach-50 font-bold">
                                        {adminUser?.name?.charAt(0) || 'A'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{adminUser?.name || 'Admin User'}</span>
                                    <span className="text-xs text-peach-400">{adminUser?.email || 'admin@example.com'}</span>
                                </div>
                            </div>
                            <DropdownMenuSeparator className="bg-peach-400/10" />
                            <DropdownMenuItem
                                className="text-peach-200/70 focus:bg-peach-200/10 focus:text-peach-200 cursor-pointer rounded-sm py-2"
                                onClick={() => router.push('/admin/settings')}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-peach-200/70 focus:bg-peach-200/10 focus:text-peach-200 cursor-pointer rounded-sm py-2"
                            >
                                <Monitor className="w-4 h-4 mr-2" />
                                System Health
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-peach-400/10" />
                            <DropdownMenuItem
                                className="text-[#A0453A] focus:bg-[#A0453A]/20 focus:text-[#A0453A] cursor-pointer rounded-sm py-2 focus:pl-4 transition-all"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
