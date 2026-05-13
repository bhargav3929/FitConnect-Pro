"use client"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@fitconnect/shared/firebase/config"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle } from "lucide-react"

interface WaitlistModalProps {
    isOpen: boolean
    onClose: () => void
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState("")

    const reset = () => {
        setName("")
        setEmail("")
        setLoading(false)
        setDone(false)
        setError("")
    }

    const handleClose = () => {
        onClose()
        setTimeout(reset, 300)
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !email.trim()) {
            setError("Please fill in all fields.")
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.")
            return
        }
        setError("")
        setLoading(true)
        try {
            await addDoc(collection(db, "waitlist"), {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                status: "new",
                createdAt: serverTimestamp(),
            })
            setDone(true)
        } catch {
            setError("Something went wrong. Please try again.")
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="bg-warmDark-800 border border-peach-200/10 text-peach-200 max-w-md rounded-none p-0 overflow-hidden">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col items-center text-center px-10 py-14 gap-5"
                        >
                            <CheckCircle className="w-12 h-12 text-terra-400" strokeWidth={1.5} />
                            <div>
                                <p className="font-display font-black text-2xl text-peach-100">
                                    You&apos;re on the list.
                                </p>
                                <p className="text-peach-400 text-sm mt-2 leading-relaxed">
                                    We&apos;ll be in touch when founding spots open. Thanks,{" "}
                                    {name.split(" ")[0]}.
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="mt-2 px-8 py-3 bg-terra-400 text-peach-50 font-black text-xs tracking-widest uppercase hover:bg-terra-300 transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <DialogHeader className="px-8 pt-8 pb-0">
                                <p className="text-[10px] tracking-[0.3em] uppercase text-terra-400 font-bold mb-1">
                                    Founding Membership
                                </p>
                                <DialogTitle className="font-display font-black text-2xl text-peach-100 leading-tight">
                                    Lock in your founding rate.
                                </DialogTitle>
                                <p className="text-peach-400 text-sm leading-relaxed mt-2">
                                    25 founding spots. First-come, first-served. We&apos;ll reach out
                                    with pricing details before anyone else.
                                </p>
                            </DialogHeader>

                            <form onSubmit={submit} className="px-8 pb-8 pt-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-peach-400">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full bg-warmDark-700 border border-peach-200/10 text-peach-100 placeholder-peach-400/30 px-4 py-3 text-sm focus:outline-none focus:border-terra-400/60 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-peach-400">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full bg-warmDark-700 border border-peach-200/10 text-peach-100 placeholder-peach-400/30 px-4 py-3 text-sm focus:outline-none focus:border-terra-400/60 transition-colors"
                                    />
                                </div>

                                {error && <p className="text-red-400 text-xs">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-terra-400 text-peach-50 font-black text-xs tracking-widest uppercase hover:bg-terra-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {loading ? "Joining…" : "Join the Waitlist"}
                                </button>
                                <p className="text-[10px] text-peach-400/50 text-center">
                                    No commitment. Pricing shared when you join.
                                </p>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
