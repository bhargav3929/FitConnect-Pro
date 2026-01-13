"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, User, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "sonner"
import Image from "next/image"

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    classDetails: {
        id: string
        name: string
        trainer: string
        date: string
        time: string
        duration: string
        centerName: string
    } | null
}

export function BookingModal({ isOpen, onClose, classDetails }: BookingModalProps) {
    const [step, setStep] = useState<'confirm' | 'success'>('confirm')
    const [isLoading, setIsLoading] = useState(false)

    if (!classDetails) return null

    const handleConfirm = async () => {
        setIsLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsLoading(false)
        setStep('success')
        toast.success("Booking Confirmed!", {
            description: "You're all set for your class.",
        })
    }

    const handleClose = () => {
        setStep('confirm')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white sm:max-w-md rounded-2xl p-0 overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === 'confirm' ? (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-6"
                        >
                            <h2 className="text-xl font-black mb-1">Confirm Booking</h2>
                            <p className="text-white/40 text-sm mb-6">Review details before confirming</p>

                            <div className="bg-white/5 rounded-xl p-4 space-y-4 mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{classDetails.name}</h3>
                                        <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                                            <User className="w-3 h-3" />
                                            {classDetails.trainer}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#7BA3A8]">{classDetails.time}</p>
                                        <p className="text-xs text-white/40">{classDetails.duration}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/40">Location</span>
                                    <span className="font-medium">{classDetails.centerName}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/40">Date</span>
                                    <span className="font-medium">{classDetails.date}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 h-12 rounded-xl border-white/10 hover:bg-white/5 hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="flex-1 h-12 bg-white text-black hover:bg-white/90 font-bold rounded-xl"
                                >
                                    {isLoading ? "Booking..." : "Confirm Booking"}
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-8 text-center"
                        >
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-black mb-2">You're Booked!</h2>
                            <p className="text-white/40 text-sm mb-8">
                                A confirmation email has been sent to you.
                                Use the app to check in when you arrive.
                            </p>
                            <Button
                                onClick={handleClose}
                                className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold rounded-xl"
                            >
                                Done
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
