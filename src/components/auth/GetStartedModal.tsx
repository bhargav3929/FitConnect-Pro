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
                <DialogContent className="sm:max-w-[600px] bg-[#0B0F19] border border-[#1A2238] p-0 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 pb-4">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-[#F0F2F5] tracking-tight text-center">
                                WELCOME TO FITPRO
                            </DialogTitle>
                            <p className="text-[#8892A4] text-center text-sm tracking-wider mt-2">
                                SELECT HOW YOU WANT TO ACCESS THE PLATFORM
                            </p>
                        </DialogHeader>
                    </div>

                    {/* Role Selection Cards */}
                    <div className="p-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Admin Card */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAdminClick}
                            className="group relative p-8 bg-gradient-to-br from-[#F0F2F5]/10 to-[#F0F2F5]/5 border border-[#1A2238] hover:border-[#F0F2F5]/30 transition-all duration-300 text-left"
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 bg-[#F0F2F5]/10 flex items-center justify-center mb-6 group-hover:bg-[#F0F2F5]/20 transition-colors">
                                <Shield className="w-8 h-8 text-[#F0F2F5]" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-black text-[#F0F2F5] mb-2 tracking-tight">
                                ADMIN PORTAL
                            </h3>
                            <p className="text-[#8892A4] text-sm leading-relaxed mb-6">
                                Access the super admin dashboard to manage classes, locations, trainers, and business analytics.
                            </p>

                            {/* Arrow */}
                            <div className="flex items-center gap-2 text-[#F0F2F5]/70 group-hover:text-[#F0F2F5] transition-colors">
                                <span className="text-xs font-bold tracking-wider">LOGIN AS ADMIN</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-[#1A2238] group-hover:border-[#F0F2F5]/30 transition-colors" />
                        </motion.button>

                        {/* User Card */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleUserClick}
                            className="group relative p-8 bg-gradient-to-br from-[#FF6A3D]/20 to-[#FF6A3D]/5 border border-[#FF6A3D]/30 hover:border-[#FF6A3D]/60 transition-all duration-300 text-left"
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 bg-[#FF6A3D]/20 flex items-center justify-center mb-6 group-hover:bg-[#FF6A3D]/30 transition-colors">
                                <User className="w-8 h-8 text-[#FF6A3D]" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-black text-[#F0F2F5] mb-2 tracking-tight">
                                MEMBER ACCESS
                            </h3>
                            <p className="text-[#8892A4] text-sm leading-relaxed mb-6">
                                Sign in to your account to book classes, track your progress, and manage your membership.
                            </p>

                            {/* Arrow */}
                            <div className="flex items-center gap-2 text-[#FF6A3D]/70 group-hover:text-[#FF6A3D] transition-colors">
                                <span className="text-xs font-bold tracking-wider">LOGIN AS USER</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-[#FF6A3D]/30 group-hover:border-[#FF6A3D]/60 transition-colors" />
                        </motion.button>
                    </div>

                    {/* Footer */}
                    <div className="px-8 pb-8">
                        <p className="text-[#5A6478] text-xs text-center tracking-wider">
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
