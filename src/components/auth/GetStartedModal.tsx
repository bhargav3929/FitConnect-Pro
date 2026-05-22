"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, User, X, ArrowRight } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { LoginModal } from "./LoginModal"

interface GetStartedModalProps {
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

export function GetStartedModal({ trigger, isOpen: controlledOpen, onClose }: GetStartedModalProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const [showLoginModal, setShowLoginModal] = React.useState(false)
    const router = useRouter()

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = (open: boolean) => {
        if (onClose && !open) {
            onClose()
        } else {
            setInternalOpen(open)
        }
    }

    const handleAdminClick = () => {
        setOpen(false)
        router.push('/admin/login')
    }

    const handleUserClick = () => {
        setOpen(false)
        router.push('/user/login')
    }

    return (
        <>
            {trigger && (
                <div onClick={() => setOpen(true)}>
                    {trigger}
                </div>
            )}

            <Dialog open={isOpen} onOpenChange={setOpen}>
                <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] overflow-y-auto bg-peach-200 border border-peach-400 p-0 sm:max-w-[600px]">
                    {/* Header */}
                    <div className="px-5 pt-6 pb-3 sm:px-8 sm:pt-8 sm:pb-4">
                        <DialogHeader>
                            <DialogTitle className="text-2xl sm:text-3xl font-black text-olive-600 tracking-normal text-center font-display">
                                WELCOME TO SOL
                            </DialogTitle>
                            <p className="text-olive-300 text-center text-xs sm:text-sm tracking-wider mt-2">
                                SELECT HOW YOU WANT TO ACCESS THE PLATFORM
                            </p>
                        </DialogHeader>
                    </div>

                    {/* Role Selection Cards */}
                    <div className="px-5 py-3 grid grid-cols-1 min-[560px]:grid-cols-2 gap-3 sm:px-8 sm:pt-4 sm:pb-5 sm:gap-5">
                        {/* Admin Card */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAdminClick}
                            className="group relative p-5 sm:p-6 bg-gradient-to-br from-olive-400/10 to-olive-400/5 border border-peach-400 hover:border-olive-400/30 transition-all duration-300 text-left"
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-olive-400/10 flex items-center justify-center mb-4 group-hover:bg-olive-400/20 transition-colors">
                                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-olive-400" />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg sm:text-xl font-black text-olive-600 mb-2 tracking-normal font-display">
                                ADMIN PORTAL
                            </h3>
                            <p className="text-olive-300 text-sm leading-relaxed mb-4">
                                Access the super admin dashboard to manage classes, facility settings, trainers, and business analytics.
                            </p>

                            {/* Arrow */}
                            <div className="flex items-center gap-2 text-olive-400/70 group-hover:text-olive-400 transition-colors">
                                <span className="text-xs font-bold tracking-wider">LOGIN AS ADMIN</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-peach-400 group-hover:border-olive-400/30 transition-colors" />
                        </motion.button>

                        {/* User Card */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleUserClick}
                            className="group relative p-5 sm:p-6 bg-gradient-to-br from-terra-400/20 to-terra-400/5 border border-terra-400/30 hover:border-terra-400/60 transition-all duration-300 text-left"
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-terra-400/20 flex items-center justify-center mb-4 group-hover:bg-terra-400/30 transition-colors">
                                <User className="w-6 h-6 sm:w-7 sm:h-7 text-terra-400" />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg sm:text-xl font-black text-olive-600 mb-2 tracking-normal font-display">
                                MEMBER ACCESS
                            </h3>
                            <p className="text-olive-300 text-sm leading-relaxed mb-4">
                                Sign in to your account to book classes, track your progress, and manage your membership.
                            </p>

                            {/* Arrow */}
                            <div className="flex items-center gap-2 text-terra-400/70 group-hover:text-terra-400 transition-colors">
                                <span className="text-xs font-bold tracking-wider">LOGIN AS USER</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-terra-400/30 group-hover:border-terra-400/60 transition-colors" />
                        </motion.button>
                    </div>

                    {/* Footer */}
                    <div className="px-5 pt-2 pb-6 sm:px-8 sm:pb-8">
                        <p className="text-olive-300 text-xs text-center tracking-wider">
                            BY CONTINUING, YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* User Login Modal */}
            <LoginModal
                isOpenOverride={showLoginModal}
                onCloseOverride={() => setShowLoginModal(false)}
            />
        </>
    )
}
