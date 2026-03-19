"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Lock, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SubscriptionPromptModalProps {
    isOpen: boolean
    onClose: () => void
    classId?: string
}

export function SubscriptionPromptModal({ isOpen, onClose, classId }: SubscriptionPromptModalProps) {
    const router = useRouter()

    const handleViewPlans = () => {
        onClose()
        const redirect = classId ? `?redirect=${classId}` : ''
        router.push(`/user/subscribe${redirect}`)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-warmDark-800/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-50 lg:top-0 lg:left-0 lg:right-0 lg:bottom-0 lg:flex lg:items-center lg:justify-center lg:pointer-events-none"
                    >
                        <div className="bg-peach-50 border-t lg:border border-peach-400/20 lg:rounded-3xl rounded-t-3xl shadow-2xl shadow-black/20 max-h-[90vh] lg:max-w-md lg:w-full flex flex-col pointer-events-auto overflow-hidden">
                            {/* Drag Handle */}
                            <div className="lg:hidden w-full flex justify-center pt-3 pb-1">
                                <div className="w-12 h-1.5 bg-peach-400/30 rounded-full" />
                            </div>

                            <div className="p-8 flex flex-col items-center text-center">
                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-peach-200/50 flex items-center justify-center hover:bg-peach-200/80 transition-colors"
                                >
                                    <X className="w-4 h-4 text-olive-600" />
                                </button>

                                {/* Lock icon */}
                                <div className="w-20 h-20 rounded-full bg-terra-400/10 flex items-center justify-center mb-6 ring-4 ring-terra-400/5">
                                    <Lock className="w-10 h-10 text-terra-400" />
                                </div>

                                <h2 className="text-2xl font-black text-olive-600 mb-2 font-display tracking-tight">
                                    Membership Required
                                </h2>
                                <p className="text-olive-300 text-sm leading-relaxed mb-8 max-w-xs">
                                    You need an active membership or class pack to book sessions. Choose a plan that fits your training goals.
                                </p>

                                <Button
                                    onClick={handleViewPlans}
                                    className="w-full h-14 bg-terra-400 text-peach-50 hover:bg-terra-300 font-black tracking-wide text-base rounded-xl transition-all hover:shadow-lg hover:shadow-terra-400/20 flex items-center justify-center gap-2"
                                >
                                    VIEW PLANS
                                    <ArrowRight className="w-5 h-5" />
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="mt-4 text-sm text-olive-300 hover:text-olive-400 font-medium transition-colors"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
