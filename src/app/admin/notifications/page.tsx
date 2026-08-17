"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Megaphone, Send, Users, Activity, Loader2, Bell, Clock } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { callSendAnnouncement } from "@fitconnect/shared/firebase/firestore"
import { toast } from "sonner"

const MAX_TITLE_LENGTH = 120
const MAX_BODY_LENGTH = 1000

type Audience = "all" | "active"

const AUDIENCES: { value: Audience; label: string; description: string; icon: typeof Users }[] = [
    {
        value: "all",
        label: "All members",
        description: "Everyone with an account, including lapsed and never-subscribed members.",
        icon: Users,
    },
    {
        value: "active",
        label: "Active plans only",
        description: "Only members with a currently active subscription.",
        icon: Activity,
    },
]

export default function AnnouncementsPage() {
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [audience, setAudience] = useState<Audience>("all")
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [isSending, setIsSending] = useState(false)

    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    const canSend = trimmedTitle.length > 0 && trimmedBody.length > 0

    const handleSend = async () => {
        setIsSending(true)
        try {
            const result = await callSendAnnouncement({
                title: trimmedTitle,
                body: trimmedBody,
                audience,
            })
            setConfirmOpen(false)
            setTitle("")
            setBody("")
            toast.success(
                result.recipients === 0
                    ? "No members matched that audience"
                    : `Announcement sent to ${result.recipients} member${result.recipients === 1 ? "" : "s"}`,
            )
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to send announcement"
            toast.error(message)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20 lg:pb-0">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pb-6 border-b border-peach-400/20"
            >
                <h2 className="app-page-title mb-2">Announcements</h2>
                <p className="app-page-subtitle">
                    Send an in-app message to your members. It appears in their notification inbox
                    the next time they open the app.
                </p>
            </motion.div>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
                {/* Composer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-peach-50 border border-peach-400/20 p-6 space-y-6"
                >
                    <div className="flex items-center gap-2.5">
                        <Megaphone className="w-4 h-4 text-terra-400" />
                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">
                            Compose
                        </p>
                    </div>

                    <div>
                        <div className="flex items-baseline justify-between mb-2">
                            <label className="block app-label">Title</label>
                            <span className="text-[10px] text-olive-300 font-mono">
                                {trimmedTitle.length}/{MAX_TITLE_LENGTH}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={title}
                            maxLength={MAX_TITLE_LENGTH}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Studio closed on Monday"
                            className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all text-sm"
                        />
                    </div>

                    <div>
                        <div className="flex items-baseline justify-between mb-2">
                            <label className="block app-label">Message</label>
                            <span className="text-[10px] text-olive-300 font-mono">
                                {trimmedBody.length}/{MAX_BODY_LENGTH}
                            </span>
                        </div>
                        <textarea
                            value={body}
                            maxLength={MAX_BODY_LENGTH}
                            onChange={(e) => setBody(e.target.value)}
                            rows={6}
                            placeholder="We're closed on Monday 25th for studio maintenance. All Monday classes have been moved to Tuesday - check your bookings for the new times."
                            className="w-full px-4 py-3 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all text-sm resize-y leading-relaxed"
                        />
                    </div>

                    <div>
                        <label className="block app-label mb-3">Audience</label>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {AUDIENCES.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setAudience(option.value)}
                                    className={`text-left p-4 border transition-all ${
                                        audience === option.value
                                            ? "border-terra-400/60 bg-terra-400/5"
                                            : "border-peach-400/15 bg-peach-200/20 hover:border-peach-400/40"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <option.icon
                                            className={`w-4 h-4 ${
                                                audience === option.value ? "text-terra-400" : "text-olive-300"
                                            }`}
                                        />
                                        <span className="text-sm font-bold text-olive-600">{option.label}</span>
                                    </div>
                                    <p className="text-[11px] text-olive-300 leading-relaxed">
                                        {option.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => setConfirmOpen(true)}
                            disabled={!canSend}
                            className="px-6 py-3.5 bg-terra-400 text-peach-50 font-bold text-xs tracking-[0.2em] uppercase hover:bg-terra-300 transition-all flex items-center gap-2.5 w-fit hover:shadow-lg hover:shadow-terra-400/15 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                        >
                            <Send className="w-4 h-4" />
                            Send Announcement
                        </button>
                    </div>
                </motion.div>

                {/* Side panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Preview */}
                    <div className="bg-peach-50 border border-peach-400/20 p-6">
                        <div className="flex items-center gap-2.5 mb-4">
                            <Bell className="w-4 h-4 text-terra-400" />
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">
                                Member Preview
                            </p>
                        </div>
                        <div className="bg-peach-100/60 border border-peach-400/15 p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 bg-terra-400 rounded-full mt-1.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-olive-600 break-words">
                                        {trimmedTitle || "Your title appears here"}
                                    </p>
                                    <p className="text-xs text-olive-400 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                                        {trimmedBody || "Your message appears here."}
                                    </p>
                                    <p className="text-[10px] text-olive-300 mt-2">Just now</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Automatic notifications */}
                    <div className="bg-peach-50 border border-peach-400/20 p-6">
                        <div className="flex items-center gap-2.5 mb-4">
                            <Clock className="w-4 h-4 text-terra-400" />
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-olive-300">
                                Sent Automatically
                            </p>
                        </div>
                        <div className="space-y-3 text-xs text-olive-400 leading-relaxed">
                            <div>
                                <p className="font-bold text-olive-600 text-sm">Class reminders</p>
                                <p>Every evening at 7:00 PM, to everyone booked into a class the next day.</p>
                            </div>
                            <div className="pt-3 border-t border-peach-400/15">
                                <p className="font-bold text-olive-600 text-sm">Plan expiry reminders</p>
                                <p>Each morning at 9:30 AM, at 7, 3, and 1 days before a plan lapses.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Confirmation */}
            <Dialog open={confirmOpen} onOpenChange={(open) => !open && setConfirmOpen(false)}>
                <DialogContent className="bg-peach-50 border-peach-400/20 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="app-section-title">Send this announcement?</DialogTitle>
                        <DialogDescription className="text-olive-300 text-sm">
                            This goes to{" "}
                            <span className="font-semibold text-olive-500">
                                {audience === "all" ? "all members" : "members with an active plan"}
                            </span>{" "}
                            immediately and cannot be recalled.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-peach-100/60 border border-peach-400/15 p-4 my-2">
                        <p className="text-sm font-bold text-olive-600 break-words">{trimmedTitle}</p>
                        <p className="text-xs text-olive-400 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                            {trimmedBody}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setConfirmOpen(false)}
                            disabled={isSending}
                            className="flex-1 h-11 border border-peach-400/25 text-olive-500 text-xs font-bold tracking-[0.2em] uppercase hover:bg-peach-200/40 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className="flex-1 h-11 bg-terra-400 text-peach-50 text-xs font-bold tracking-[0.2em] uppercase hover:bg-terra-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSending ? "Sending" : "Send"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
