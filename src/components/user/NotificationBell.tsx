"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, CalendarClock, CreditCard, Megaphone, Check } from "lucide-react"
import {
    subscribeToUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "@fitconnect/shared/firebase/firestore"
import type { AppNotification, NotificationType } from "@fitconnect/shared/types/notification"
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore"

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
    class_reminder: CalendarClock,
    plan_expiry: CreditCard,
    announcement: Megaphone,
}

function relativeTime(date: Date | string | undefined): string {
    if (!date) return ""
    const d = typeof date === "string" ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return ""

    const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
    if (seconds < 60) return "Just now"

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`

    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

/**
 * `tone` matches the bell trigger to its surroundings: 'light' for the peach
 * mobile header, 'dark' for the warmDark desktop sidebar. The dropdown itself
 * is always the light popover surface.
 */
export function NotificationBell({
    className = "",
    tone = "light",
    align = "right",
}: {
    className?: string
    tone?: "light" | "dark"
    align?: "left" | "right"
}) {
    const clientUser = useClientAuthStore((state) => state.clientUser)
    const userId = clientUser?.id

    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!userId) return

        const unsubscribe = subscribeToUserNotifications(userId, setNotifications, () => {
            // A failed listener should leave the bell empty rather than break the page.
            setNotifications([])
        })

        // Clearing on teardown stops one member's notifications flashing up for
        // the next one after a logout/login on the same device.
        return () => {
            unsubscribe()
            setNotifications([])
        }
    }, [userId])

    // Close on outside click and on Escape.
    useEffect(() => {
        if (!isOpen) return

        const onPointerDown = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false)
        }

        document.addEventListener("mousedown", onPointerDown)
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("mousedown", onPointerDown)
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [isOpen])

    if (!userId) return null

    const unreadCount = notifications.filter((n) => !n.read).length

    const handleOpenNotification = (notification: AppNotification) => {
        if (!notification.read) {
            void markNotificationRead(notification.id).catch(() => { })
        }
        setIsOpen(false)
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen((open) => !open)}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                aria-expanded={isOpen}
                className={`relative w-9 h-9 flex items-center justify-center transition-colors ${
                    tone === "dark"
                        ? "text-peach-400/60 hover:text-peach-200"
                        : "text-olive-400 hover:text-terra-400"
                }`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-terra-400 text-peach-50 text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-2 w-[min(360px,calc(100vw-2rem))] max-h-[420px] overflow-y-auto bg-peach-50 border border-peach-400/25 shadow-xl shadow-olive-600/10 z-50`}
                    >
                        <div className="sticky top-0 bg-peach-50 flex items-center justify-between px-4 py-3 border-b border-peach-400/15">
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">
                                Notifications
                            </p>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => void markAllNotificationsRead(notifications).catch(() => { })}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-terra-400 hover:text-terra-500 transition-colors"
                                >
                                    <Check className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <Bell className="w-6 h-6 text-olive-300/30 mx-auto mb-2" />
                                <p className="text-sm text-olive-300">You&apos;re all caught up</p>
                            </div>
                        ) : (
                            <ul>
                                {notifications.map((notification) => {
                                    const Icon = TYPE_ICONS[notification.type] ?? Bell
                                    const content = (
                                        <div
                                            className={`flex items-start gap-3 px-4 py-3 border-b border-peach-400/10 transition-colors hover:bg-peach-200/30 ${
                                                notification.read ? "" : "bg-terra-400/[0.04]"
                                            }`}
                                        >
                                            <Icon
                                                className={`w-4 h-4 mt-0.5 shrink-0 ${
                                                    notification.read ? "text-olive-300" : "text-terra-400"
                                                }`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={`text-sm leading-snug break-words ${
                                                        notification.read
                                                            ? "text-olive-500 font-medium"
                                                            : "text-olive-700 font-bold"
                                                    }`}
                                                >
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-olive-400 mt-0.5 leading-relaxed break-words">
                                                    {notification.body}
                                                </p>
                                                <p className="text-[10px] text-olive-300 mt-1">
                                                    {relativeTime(notification.createdAt)}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <span className="w-1.5 h-1.5 bg-terra-400 rounded-full mt-1.5 shrink-0" />
                                            )}
                                        </div>
                                    )

                                    return (
                                        <li key={notification.id}>
                                            {notification.link ? (
                                                <Link
                                                    href={notification.link}
                                                    onClick={() => handleOpenNotification(notification)}
                                                    className="block text-left w-full"
                                                >
                                                    {content}
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => handleOpenNotification(notification)}
                                                    className="block text-left w-full"
                                                >
                                                    {content}
                                                </button>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
