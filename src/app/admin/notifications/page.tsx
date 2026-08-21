"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Megaphone, Send, Users, Activity, Loader2, Bell, Clock, UserPlus, UserCheck, Search, Check, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { callSendAnnouncement, getAllMembers } from "@fitconnect/shared/firebase/firestore"
import type { UserProfile } from "@fitconnect/shared/types/user"
import { toast } from "sonner"

const MAX_TITLE_LENGTH = 120
const MAX_BODY_LENGTH = 1000

type Audience = "all" | "active" | "demo_pending" | "custom"

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
    {
        value: "demo_pending",
        label: "Demo not purchased",
        description: "Members who signed up but have not bought a Demo Class or membership.",
        icon: UserPlus,
    },
    {
        value: "custom",
        label: "Custom members",
        description: "Pick one or more members manually.",
        icon: UserCheck,
    },
]

function memberDisplayName(member: UserProfile): string {
    return member.displayName || member.name || member.email || "Member"
}

function getAudienceSummary(audience: Audience, selectedCount: number): string {
    if (audience === "active") return "members with an active plan"
    if (audience === "demo_pending") return "members who signed up but have not purchased a Demo Class or membership"
    if (audience === "custom") {
        return `${selectedCount} selected member${selectedCount === 1 ? "" : "s"}`
    }
    return "all members"
}

export default function AnnouncementsPage() {
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [audience, setAudience] = useState<Audience>("all")
    const [members, setMembers] = useState<UserProfile[]>([])
    const [isLoadingMembers, setIsLoadingMembers] = useState(false)
    const [hasLoadedMembers, setHasLoadedMembers] = useState(false)
    const [memberSearch, setMemberSearch] = useState("")
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [isSending, setIsSending] = useState(false)

    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    const canSend = trimmedTitle.length > 0 && trimmedBody.length > 0 && (audience !== "custom" || selectedMemberIds.length > 0)

    const loadMembers = async () => {
        if (hasLoadedMembers || isLoadingMembers) return

        setIsLoadingMembers(true)
        try {
            const items = await getAllMembers()
            setMembers([...items].sort((a, b) => memberDisplayName(a).localeCompare(memberDisplayName(b))))
            setHasLoadedMembers(true)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load members"
            toast.error(message)
        } finally {
            setIsLoadingMembers(false)
        }
    }

    const selectedMemberSet = useMemo(() => new Set(selectedMemberIds), [selectedMemberIds])
    const selectedMembers = useMemo(
        () => members.filter((member) => selectedMemberSet.has(member.uid)),
        [members, selectedMemberSet],
    )
    const filteredMembers = useMemo(() => {
        const query = memberSearch.trim().toLowerCase()
        if (!query) return members

        return members.filter((member) => {
            const name = memberDisplayName(member).toLowerCase()
            const email = member.email?.toLowerCase() ?? ""
            const phone = member.phone?.toLowerCase() ?? ""
            return name.includes(query) || email.includes(query) || phone.includes(query)
        })
    }, [memberSearch, members])

    const audienceSummary = getAudienceSummary(audience, selectedMemberIds.length)

    const handleAudienceChange = (nextAudience: Audience) => {
        setAudience(nextAudience)
        if (nextAudience === "custom") {
            void loadMembers()
        }
    }

    const toggleMember = (memberId: string) => {
        setSelectedMemberIds((prev) => (
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        ))
    }

    const selectVisibleMembers = () => {
        setSelectedMemberIds((prev) => Array.from(new Set([...prev, ...filteredMembers.map((member) => member.uid)])))
    }

    const handleSend = async () => {
        setIsSending(true)
        try {
            const result = await callSendAnnouncement({
                title: trimmedTitle,
                body: trimmedBody,
                audience,
                ...(audience === "custom" ? { memberIds: selectedMemberIds } : {}),
            })
            setConfirmOpen(false)
            setTitle("")
            setBody("")
            setMemberSearch("")
            setSelectedMemberIds([])
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
                    Send an in-app and push message to your members. It appears in their notification inbox
                    and on registered devices.
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
                                    onClick={() => handleAudienceChange(option.value)}
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

                    {audience === "custom" && (
                        <div className="border border-peach-400/15 bg-peach-100/35 p-4 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-sm font-bold text-olive-600">Selected members</p>
                                    <p className="text-[11px] text-olive-300">
                                        {selectedMemberIds.length} selected for this announcement
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectVisibleMembers}
                                        disabled={filteredMembers.length === 0 || isLoadingMembers}
                                        className="h-9 px-3 text-[10px] font-bold tracking-[0.16em] uppercase text-olive-500 border border-peach-400/20 hover:bg-peach-200/50 transition-colors disabled:opacity-40"
                                    >
                                        Select Visible
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMemberIds([])}
                                        disabled={selectedMemberIds.length === 0}
                                        className="h-9 px-3 text-[10px] font-bold tracking-[0.16em] uppercase text-olive-500 border border-peach-400/20 hover:bg-peach-200/50 transition-colors disabled:opacity-40"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300" />
                                <input
                                    type="text"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    placeholder="Search by name, email, or phone"
                                    className="w-full h-11 pl-10 pr-4 bg-peach-50 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:outline-none transition-all text-sm"
                                />
                            </div>

                            {selectedMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedMembers.slice(0, 12).map((member) => (
                                        <button
                                            key={member.uid}
                                            type="button"
                                            onClick={() => toggleMember(member.uid)}
                                            className="h-8 px-2.5 bg-terra-400/10 text-terra-500 text-[11px] font-semibold flex items-center gap-1.5"
                                        >
                                            {memberDisplayName(member)}
                                            <X className="w-3 h-3" />
                                        </button>
                                    ))}
                                    {selectedMembers.length > 12 && (
                                        <span className="h-8 px-2.5 bg-peach-200/60 text-olive-400 text-[11px] font-semibold inline-flex items-center">
                                            +{selectedMembers.length - 12} more
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="max-h-80 overflow-y-auto border border-peach-400/15 bg-peach-50">
                                {isLoadingMembers ? (
                                    <div className="h-36 flex items-center justify-center gap-2 text-sm text-olive-400">
                                        <Loader2 className="w-4 h-4 animate-spin text-terra-400" />
                                        Loading members
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div className="h-32 flex items-center justify-center text-sm text-olive-300">
                                        No members found
                                    </div>
                                ) : (
                                    filteredMembers.map((member) => {
                                        const selected = selectedMemberSet.has(member.uid)
                                        return (
                                            <button
                                                key={member.uid}
                                                type="button"
                                                onClick={() => toggleMember(member.uid)}
                                                className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-peach-400/10 last:border-b-0 transition-colors ${
                                                    selected ? "bg-terra-400/5" : "hover:bg-peach-100/70"
                                                }`}
                                            >
                                                <span
                                                    className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                                                        selected
                                                            ? "bg-terra-400 border-terra-400 text-peach-50"
                                                            : "border-peach-400/30 text-transparent"
                                                    }`}
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-bold text-olive-600 truncate">
                                                        {memberDisplayName(member)}
                                                    </span>
                                                    <span className="block text-xs text-olive-300 truncate">
                                                        {member.email || "No email"}{member.phone ? ` - ${member.phone}` : ""}
                                                    </span>
                                                </span>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}

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
                        <div className="mt-4 pt-4 border-t border-peach-400/15">
                            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-olive-300">
                                Audience
                            </p>
                            <p className="text-sm font-bold text-olive-600 mt-1">{audienceSummary}</p>
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
                                {audienceSummary}
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
