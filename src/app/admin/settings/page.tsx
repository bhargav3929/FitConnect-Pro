"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    User,
    Bell,
    Lock,
    Globe,
    Save,
    LogOut,
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
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-sand-200 font-display">Settings</h2>
                <p className="text-sage-500 text-sm mt-1">
                    Manage your account and preferences
                </p>
            </div>

            {/* Profile Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-forest-700 border border-forest-600 p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-sage-400" />
                    <h3 className="text-lg font-bold text-sand-200">Profile</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-sage-400 tracking-wider mb-2">
                            DISPLAY NAME
                        </label>
                        <input
                            type="text"
                            defaultValue={adminUser?.name || "Super Admin"}
                            className="w-full h-12 px-4 bg-sand-200/5 border border-forest-600 text-sand-200 focus:border-gold-400/50 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-sage-400 tracking-wider mb-2">
                            EMAIL
                        </label>
                        <input
                            type="email"
                            defaultValue={adminUser?.email || "admin@solpilates.com"}
                            className="w-full h-12 px-4 bg-sand-200/5 border border-forest-600 text-sand-200 focus:border-gold-400/50 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-sage-400 tracking-wider mb-2">
                            ROLE
                        </label>
                        <input
                            type="text"
                            defaultValue="Super Admin"
                            disabled
                            className="w-full h-12 px-4 bg-sand-200/5 border border-forest-600 text-sage-400 cursor-not-allowed"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Notification Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-forest-700 border border-forest-600 p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-5 h-5 text-sage-400" />
                    <h3 className="text-lg font-bold text-sand-200">Notifications</h3>
                </div>

                <div className="space-y-4">
                    {[
                        { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive email notifications for important updates' },
                        { key: 'newBookings', label: 'New Bookings', description: 'Get notified when members book classes' },
                        { key: 'memberJoined', label: 'New Members', description: 'Get notified when new members join' },
                        { key: 'classReminders', label: 'Class Reminders', description: 'Receive reminders before classes start' },
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-forest-600/50 last:border-0">
                            <div>
                                <p className="text-sand-200 font-medium">{item.label}</p>
                                <p className="text-sage-500 text-sm">{item.description}</p>
                            </div>
                            <button
                                onClick={() => setNotifications(prev => ({
                                    ...prev,
                                    [item.key]: !prev[item.key as keyof typeof notifications]
                                }))}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications]
                                        ? 'bg-gold-400'
                                        : 'bg-sand-200/20'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications[item.key as keyof typeof notifications]
                                            ? 'left-7'
                                            : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-forest-700 border border-forest-600 p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-5 h-5 text-sage-400" />
                    <h3 className="text-lg font-bold text-sand-200">Security</h3>
                </div>

                <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 bg-sand-200/5 hover:bg-sand-200/10 transition-colors text-left">
                        <div>
                            <p className="text-sand-200 font-medium">Change Password</p>
                            <p className="text-sage-500 text-sm">Update your admin password</p>
                        </div>
                        <span className="text-sage-500">→</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-sand-200/5 hover:bg-sand-200/10 transition-colors text-left">
                        <div>
                            <p className="text-sand-200 font-medium">Two-Factor Authentication</p>
                            <p className="text-sage-500 text-sm">Add an extra layer of security</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold">COMING SOON</span>
                    </button>
                </div>
            </motion.div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleSave}
                    className="px-8 py-4 bg-gold-400 text-forest-700 font-bold text-sm tracking-wider hover:bg-gold-300 transition-all flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    SAVE CHANGES
                </button>
                <button
                    onClick={handleLogout}
                    className="px-8 py-4 bg-red-500/20 text-red-400 font-bold text-sm tracking-wider hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    LOGOUT
                </button>
            </div>
        </div>
    )
}
