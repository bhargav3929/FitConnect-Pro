"use client"

import { motion } from "framer-motion"
import {
    User,
    Lock,
    LogOut,
} from "lucide-react"
import { useAdminAuthStore } from "@fitconnect/shared/stores/adminAuthStore"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
    const { adminUser, logoutAdmin } = useAdminAuthStore()
    const router = useRouter()

    const handleLogout = async () => {
        await logoutAdmin()
        router.push('/')
    }

    return (
        <div className="max-w-4xl space-y-8 pb-20 lg:pb-0">
            {/* Premium Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pb-6 border-b border-peach-400/20"
            >
                <h2 className="text-4xl md:text-5xl font-black text-olive-600 tracking-tight mb-2 font-display">
                    Settings
                </h2>
                <p className="text-olive-300 text-sm md:text-base tracking-wide max-w-lg">
                    View your admin account details and manage your session.
                </p>
            </motion.div>

            {/* Profile Section — Read Only */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center">
                        <User className="w-5 h-5 text-olive-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-olive-600">Profile</h3>
                        <p className="text-olive-300 text-xs tracking-wider uppercase">Account information</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2.5">
                            Display Name
                        </label>
                        <div className="w-full h-12 px-4 bg-peach-200/20 border border-peach-400/10 text-olive-600 flex items-center">
                            {adminUser?.name || "Admin"}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2.5">
                            Email
                        </label>
                        <div className="w-full h-12 px-4 bg-peach-200/20 border border-peach-400/10 text-olive-600 flex items-center">
                            {adminUser?.email || "—"}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2.5">
                            Role
                        </label>
                        <div className="w-full h-12 px-4 bg-peach-200/20 border border-peach-400/10 text-olive-300 flex items-center">
                            Super Admin
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-olive-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-olive-600">Security</h3>
                        <p className="text-olive-300 text-xs tracking-wider uppercase">Authentication is managed via Firebase</p>
                    </div>
                </div>

                <p className="text-olive-300 text-sm leading-relaxed">
                    Password changes and two-factor authentication are managed through Firebase Authentication.
                    Contact your system administrator to update credentials.
                </p>
            </motion.div>

            {/* Logout */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <button
                    onClick={handleLogout}
                    className="px-8 py-4 bg-red-500/8 text-red-600 font-bold text-xs tracking-[0.2em] uppercase hover:bg-red-500/15 ring-1 ring-red-500/15 hover:ring-red-500/25 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </motion.div>
        </div>
    )
}
