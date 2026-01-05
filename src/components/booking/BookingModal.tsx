"use client"

import * as React from "react"
import { Calendar, Clock, MapPin, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ClassSession } from "@/types/class"
import { useAuth } from "@/lib/hooks/useAuth"

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    session: ClassSession | null
    gymName?: string
}

export function BookingModal({ isOpen, onClose, session, gymName }: BookingModalProps) {
    const { user } = useAuth()
    const [step, setStep] = React.useState<'confirm' | 'success'>('confirm')
    const [loading, setLoading] = React.useState(false)

    // Reset step when modal opens/closes
    React.useEffect(() => {
        if (isOpen) setStep('confirm')
    }, [isOpen])

    if (!session) return null

    const handleConfirm = async () => {
        setLoading(true)
        // Simulate API call
        setTimeout(() => {
            setLoading(false)
            setStep('success')
        }, 1500)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md overflow-hidden bg-card border-border">
                <AnimatePresence mode="wait">
                    {step === 'confirm' ? (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-center mb-2">Confirm Booking</DialogTitle>
                                <DialogDescription className="text-center">
                                    You are about to book a spot for:
                                </DialogDescription>
                            </DialogHeader>

                            <div className="my-6 space-y-4 bg-muted/30 p-4 rounded-xl border border-muted">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{session.classType}</p>
                                        <p className="text-sm text-muted-foreground">{session.startTime} ({session.duration} min)</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{gymName || "Gym Center"}</p>
                                        <p className="text-sm text-muted-foreground">32 Hudson Yards, NY</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Today</p>
                                        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="flex-col sm:flex-col gap-3">
                                <Button
                                    className="w-full h-12 text-lg font-semibold shadow-glow hover:shadow-glow-lg transition-all"
                                    onClick={handleConfirm}
                                    disabled={loading}
                                >
                                    {loading ? "Confirming..." : "Confirm Booking"}
                                </Button>
                                <Button variant="ghost" className="w-full" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6"
                        >
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">You're All Set! 🎉</h2>
                            <p className="text-muted-foreground mb-8">
                                Your spot for <strong>{session.classType}</strong> has been confirmed.
                                We've sent the details to your email.
                            </p>
                            <Button className="w-full h-11" onClick={onClose}>
                                Done
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
