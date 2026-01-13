"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Info, Clock, MapPin, User, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface SpotSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    classDetails: {
        id: string
        name: string
        date: string
        time: string
        duration: string
        location: string
        instructor: string
        totalSpots: number
        bookedSpots: number[]
    } | null
    onConfirm: (spotNumber: number, isGuest: boolean) => void
}

type SpotState = 'available' | 'unavailable' | 'selected' | 'guest'

export function SpotSelectionModal({
    isOpen,
    onClose,
    classDetails,
    onConfirm
}: SpotSelectionModalProps) {
    const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select')
    const [selectedSpot, setSelectedSpot] = useState<number | null>(null)
    const [reserveFor, setReserveFor] = useState<'myself' | 'guest'>('myself')
    const [isLoading, setIsLoading] = useState(false)

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep('select')
            setSelectedSpot(null)
            setReserveFor('myself')
        }
    }, [isOpen])

    if (!classDetails) return null

    const { totalSpots, bookedSpots } = classDetails
    const spots = Array.from({ length: totalSpots }, (_, i) => i + 1)

    const getSpotState = (spotNumber: number): SpotState => {
        if (bookedSpots.includes(spotNumber)) return 'unavailable'
        if (selectedSpot === spotNumber) {
            return reserveFor === 'guest' ? 'guest' : 'selected'
        }
        return 'available'
    }

    const handleSpotClick = (spotNumber: number) => {
        if (bookedSpots.includes(spotNumber)) return
        setSelectedSpot(spotNumber)
    }

    const handleConfirm = async () => {
        if (!selectedSpot) return
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsLoading(false)
        setStep('success')
        toast.success("Spot Reserved!", {
            description: `Spot ${selectedSpot} has been reserved.`,
            className: "bg-[#0A0A0A] text-white border-white/10"
        })
    }

    const handleClose = () => {
        onClose()
    }

    const handleFinalConfirm = () => {
        if (selectedSpot) {
            onConfirm(selectedSpot, reserveFor === 'guest')
        }
        handleClose()
    }

    const availableCount = totalSpots - bookedSpots.length

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content - Mobile Bottom Sheet / Desktop Modal */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-50 lg:top-0 lg:left-0 lg:right-0 lg:bottom-0 lg:flex lg:items-center lg:justify-center lg:bg-transparent lg:pointer-events-none"
                    >
                        {/* Container that acts as Sheet on Mobile, Card on Desktop */}
                        <div className="bg-[#0A0A0A] border-t lg:border border-white/10 lg:rounded-3xl rounded-t-3xl shadow-2xl shadow-black max-h-[90vh] lg:max-w-4xl lg:w-full lg:max-h-[800px] flex flex-col pointer-events-auto overflow-hidden">

                            {/* Drag Handle (Mobile only) */}
                            <div className="lg:hidden w-full flex justify-center pt-3 pb-1">
                                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                            </div>

                            <AnimatePresence mode="wait">
                                {step === 'select' && (
                                    <motion.div
                                        key="select"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="p-6 lg:p-8 flex flex-col h-full overflow-y-auto"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h2 className="text-2xl font-black text-white mb-1">Select Spot</h2>
                                                <p className="text-white/40 text-xs tracking-wider uppercase">
                                                    {classDetails.name} • {classDetails.time}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleClose}
                                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>

                                        {/* Class Info Compact */}
                                        <div className="bg-white/5 rounded-2xl p-4 mb-6 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#7BA3A8]/20 flex items-center justify-center text-[#7BA3A8] font-bold text-lg">
                                                {classDetails.date.split(' ')[0]}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{classDetails.instructor}</p>
                                                <p className="text-white/40 text-sm">{classDetails.location} • {classDetails.duration}</p>
                                            </div>
                                        </div>

                                        {/* Legend & Toggle */}
                                        <div className="flex flex-col gap-4 mb-8">
                                            {/* Toggle */}
                                            <div className="flex bg-white/5 p-1 rounded-xl self-start">
                                                <button
                                                    onClick={() => setReserveFor('myself')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reserveFor === 'myself' ? 'bg-[#7BA3A8] text-white shadow-lg' : 'text-white/40 hover:text-white'
                                                        }`}
                                                >
                                                    Myself
                                                </button>
                                                <button
                                                    onClick={() => setReserveFor('guest')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reserveFor === 'guest' ? 'bg-[#7BA3A8] text-white shadow-lg' : 'text-white/40 hover:text-white'
                                                        }`}
                                                >
                                                    Guest
                                                </button>
                                            </div>

                                            {/* Legend */}
                                            <div className="flex items-center gap-4 text-xs text-white/40 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full border border-white/20" /> Available
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-white/10 diagonal-stripes" /> Booked
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-[#7BA3A8] shadow-[0_0_10px_rgba(123,163,168,0.5)]" /> Selected
                                                </div>
                                            </div>
                                        </div>

                                        {/* Spots Grid - The "Stage" */}
                                        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] relative">
                                            {/* Stage Indicator */}
                                            <div className="w-full max-w-xm text-center mb-8">
                                                <div className="h-1 w-3/4 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent mb-2" />
                                                <span className="text-[10px] uppercase tracking-[0.3em] text-white/20">Front of Room</span>
                                            </div>

                                            <div className="grid grid-cols-4 gap-4 sm:gap-6">
                                                {spots.map((spotNum) => {
                                                    const state = getSpotState(spotNum)
                                                    const isUnavailable = state === 'unavailable'
                                                    const isSelected = state === 'selected' || state === 'guest'

                                                    return (
                                                        <motion.button
                                                            key={spotNum}
                                                            onClick={() => handleSpotClick(spotNum)}
                                                            disabled={isUnavailable}
                                                            whileHover={!isUnavailable ? { scale: 1.1 } : {}}
                                                            whileTap={!isUnavailable ? { scale: 0.9 } : {}}
                                                            className={`
                                                                relative w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300
                                                                ${isUnavailable
                                                                    ? 'bg-white/5 text-white/10 cursor-not-allowed'
                                                                    : isSelected
                                                                        ? 'bg-[#7BA3A8] text-white shadow-[0_0_20px_rgba(123,163,168,0.4)] scale-110'
                                                                        : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/40 hover:bg-white/10'
                                                                }
                                                            `}
                                                        >
                                                            {isUnavailable && (
                                                                <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-20">
                                                                    <svg className="w-full h-full">
                                                                        <pattern id={`stripe-${spotNum}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                                                            <rect width="2" height="4" transform="translate(0,0)" fill="white"></rect>
                                                                        </pattern>
                                                                        <rect width="100%" height="100%" fill={`url(#stripe-${spotNum})`}></rect>
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            {spotNum}
                                                        </motion.button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="mt-8 pt-6 border-t border-white/10">
                                            <Button
                                                onClick={handleConfirm}
                                                disabled={!selectedSpot || isLoading}
                                                className="w-full h-14 bg-white text-black hover:bg-white/90 font-black tracking-wide text-lg rounded-xl disabled:opacity-50 transition-all"
                                            >
                                                {isLoading ? "CONFIRMING..." : selectedSpot ? `CONFIRM SPOT ${selectedSpot}` : "SELECT A SPOT"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-8 flex flex-col items-center justify-center h-full text-center min-h-[500px]"
                                    >
                                        <div className="w-24 h-24 bg-[#7BA3A8]/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-[#7BA3A8]/10 animate-pulse">
                                            <CheckCircle2 className="w-12 h-12 text-[#7BA3A8]" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white mb-2">You're In!</h2>
                                        <p className="text-white/60 text-lg mb-8 max-w-xs">
                                            Spot <span className="text-[#7BA3A8] font-bold">{selectedSpot}</span> confirmed for Class.
                                        </p>

                                        <div className="bg-white/5 rounded-2xl p-6 w-full max-w-sm mb-8 border border-white/10">
                                            <div className="flex justify-between mb-4 pb-4 border-b border-white/10">
                                                <span className="text-white/40 text-sm">Date</span>
                                                <span className="text-white font-bold">{classDetails.date}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/40 text-sm">Listing</span>
                                                <span className="text-white font-bold text-right">{classDetails.name}</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleFinalConfirm}
                                            className="w-full max-w-sm h-14 bg-[#7BA3A8] text-white hover:bg-[#689095] font-black tracking-wide rounded-xl shadow-[0_0_20px_rgba(123,163,168,0.3)]"
                                        >
                                            DONE
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
