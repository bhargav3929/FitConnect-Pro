"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    User,
    Bell,
    Lock,
    Save,
    LogOut,
    Shield,
    ChevronRight,
} from "lucide-react"
import { useAdminAuthStore } from "@/lib/store/adminAuthStore"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function SettingsPage() {
    const { adminUser, logoutAdmin } = useAdminAuthStore()
    const router = useRouter()

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        newBookings: true,
        memberJoined: true,
        classReminders: false,
    })

    const handleSave = () => {
        toast.success("Settings saved successfully!")
    }

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
                    Manage your admin account, notification preferences, and security settings.
                </p>
            </motion.div>

            {/* Profile Section */}
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
                        <input
                            type="text"
                            defaultValue={adminUser?.name || "Super Admin"}
                            className="w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-white focus:outline-none transition-all duration-300"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2.5">
                            Email
                        </label>
                        <input
                            type="email"
                            defaultValue={adminUser?.email || "admin@solpilates.com"}
                            className="w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-white focus:outline-none transition-all duration-300"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-olive-400 tracking-[0.15em] uppercase mb-2.5">
                            Role
                        </label>
                        <div className="w-full h-12 px-4 bg-peach-200/20 border border-peach-400/10 text-olive-300 flex items-center cursor-not-allowed">
                            Super Admin
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Notification Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-olive-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-olive-600">Notifications</h3>
                        <p className="text-olive-300 text-xs tracking-wider uppercase">Alert preferences</p>
                    </div>
                </div>

                <div className="space-y-1">
                    {[
                        { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive email notifications for important updates' },
                        { key: 'newBookings', label: 'New Bookings', description: 'Get notified when members book classes' },
                        { key: 'memberJoined', label: 'New Members', description: 'Get notified when new members join' },
                        { key: 'classReminders', label: 'Class Reminders', description: 'Receive reminders before classes start' },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + idx * 0.05 }}
                            className="flex items-center justify-between py-4 border-b border-peach-400/8 last:border-0 hover:bg-peach-100/40 -mx-2 px-2 transition-colors rounded-sm"
                        >
                            <div>
                                <p className="text-olive-600 font-medium text-sm">{item.label}</p>
                                <p className="text-olive-300 text-xs mt-0.5">{item.description}</p>
                            </div>
                            <button
                                onClick={() => setNotifications(prev => ({
                                    ...prev,
                                    [item.key]: !prev[item.key as keyof typeof notifications]
                                }))}
                                className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${notifications[item.key as keyof typeof notifications]
                                    ? 'bg-terra-400 shadow-inner shadow-terra-500/20'
                                    : 'bg-peach-400/25'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${notifications[item.key as keyof typeof notifications]
                                        ? 'left-6'
                                        : 'left-1'
                                        }`}
                                />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-olive-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-olive-600">Security</h3>
                        <p className="text-olive-300 text-xs tracking-wider uppercase">Password & authentication</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 bg-peach-200/25 border border-peach-400/10 hover:bg-peach-200/50 hover:border-peach-400/20 transition-all text-left group">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-olive-300 group-hover:text-terra-400 transition-colors" />
                            <div>
                                <p className="text-olive-600 font-medium text-sm">Change Password</p>
                                <p className="text-olive-300 text-xs mt-0.5">Update your admin password</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-olive-300 group-hover:text-olive-600 group-hover:translate-x-1 transition-all" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-peach-200/25 border border-peach-400/10 hover:bg-peach-200/50 hover:border-peach-400/20 transition-all text-left group">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-olive-300 group-hover:text-terra-400 transition-colors" />
                            <div>
                                <p className="text-olive-600 font-medium text-sm">Two-Factor Authentication</p>
                                <p className="text-olive-300 text-xs mt-0.5">Add an extra layer of security</p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-700 text-[10px] font-bold tracking-wider ring-1 ring-yellow-500/20 rounded-sm">
                            COMING SOON
                        </span>
                    </button>
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <button
                    onClick={handleSave}
                    className="px-8 py-4 bg-terra-400 text-peach-50 font-bold text-xs tracking-[0.2em] uppercase hover:bg-terra-300 transition-all flex items-center justify-center gap-2.5 hover:shadow-lg hover:shadow-terra-400/15 active:scale-[0.98]"
                >
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
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
