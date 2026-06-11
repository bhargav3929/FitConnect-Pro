"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Lock, LogOut, Pencil, Check, X } from "lucide-react"
import { updateProfile } from "firebase/auth"
import { useAdminAuthStore } from "@fitconnect/shared/stores/adminAuthStore"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function SettingsPage() {
    const { adminUser, firebaseUser, logoutAdmin, updateAdminName } = useAdminAuthStore()
    const router = useRouter()

    const [isEditing, setIsEditing] = useState(false)
    const [displayName, setDisplayName] = useState(adminUser?.name || "")
    const [isSaving, setIsSaving] = useState(false)

    const handleEdit = () => {
        setDisplayName(adminUser?.name || "")
        setIsEditing(true)
    }

    const handleCancel = () => {
        setDisplayName(adminUser?.name || "")
        setIsEditing(false)
    }

    const handleSave = async () => {
        const trimmed = displayName.trim()
        if (!trimmed) {
            toast.error("Display name cannot be empty")
            return
        }
        if (!firebaseUser) {
            toast.error("Not authenticated")
            return
        }
        setIsSaving(true)
        try {
            await updateProfile(firebaseUser, { displayName: trimmed })
            updateAdminName(trimmed)
            setIsEditing(false)
            toast.success("Display name updated")
        } catch {
            toast.error("Failed to update display name")
        } finally {
            setIsSaving(false)
        }
    }

    const handleLogout = async () => {
        await logoutAdmin()
        router.push("/")
    }

    return (
        <div className="max-w-4xl space-y-8 pb-20 lg:pb-0">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pb-6 border-b border-peach-400/20"
            >
                <h2 className="app-page-title mb-2">Settings</h2>
                <p className="app-page-subtitle">
                    Manage your admin account profile and session.
                </p>
            </motion.div>

            {/* Profile Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center">
                            <User className="w-5 h-5 text-olive-400" />
                        </div>
                        <div>
                            <h3 className="app-card-title">Profile</h3>
                            <p className="text-olive-300 text-xs tracking-wider uppercase">Account information</p>
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider uppercase text-olive-400 border border-peach-400/30 hover:border-terra-400 hover:text-terra-400 transition-all"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block app-label mb-2.5">Display Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSave()
                                    if (e.key === "Escape") handleCancel()
                                }}
                                autoFocus
                                className="w-full h-12 px-4 bg-peach-100 border border-terra-400/50 text-olive-700 focus:outline-none focus:border-terra-400 transition-colors"
                            />
                        ) : (
                            <div className="w-full h-12 px-4 bg-peach-200/20 border border-peach-400/10 text-olive-600 flex items-center">
                                {adminUser?.name || "Admin"}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block app-label mb-2.5">Email</label>
                        <div className="w-full h-12 px-4 bg-peach-200/20 border border-peach-400/10 text-olive-600 flex items-center">
                            {adminUser?.email || "—"}
                        </div>
                    </div>
                    <div>
                        <label className="block app-label mb-2.5">Role</label>
                        <div className="w-full h-12 px-4 bg-peach-200/20 border border-peach-400/10 text-olive-300 flex items-center">
                            Super Admin
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-terra-400 text-peach-50 text-xs font-bold tracking-wider uppercase hover:bg-terra-500 transition-colors disabled:opacity-50"
                        >
                            <Check className="w-3.5 h-3.5" />
                            {isSaving ? "Saving…" : "Save"}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-5 py-2.5 border border-peach-400/30 text-olive-400 text-xs font-bold tracking-wider uppercase hover:border-olive-400 transition-colors disabled:opacity-50"
                        >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                        </button>
                    </div>
                )}
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
                        <h3 className="app-card-title">Security</h3>
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
