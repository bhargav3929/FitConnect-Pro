"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, Lock, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MockPaymentFormProps {
    amount: number
    planName: string
    onPaymentComplete: () => void
    onPaymentError: (error: string) => void
    isProcessing: boolean
    setIsProcessing: (v: boolean) => void
}

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'unknown'

function getCardBrand(number: string): CardBrand {
    const clean = number.replace(/\s/g, '')
    if (clean.startsWith('4')) return 'visa'
    if (clean.startsWith('5') || clean.startsWith('2')) return 'mastercard'
    if (clean.startsWith('3')) return 'amex'
    return 'unknown'
}

function formatCardNumber(value: string): string {
    const clean = value.replace(/\D/g, '').slice(0, 16)
    return clean.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
    const clean = value.replace(/\D/g, '').slice(0, 4)
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`
    return clean
}

const BRAND_LABELS: Record<CardBrand, string> = {
    visa: 'VISA',
    mastercard: 'MC',
    amex: 'AMEX',
    unknown: '',
}

export function MockPaymentForm({
    amount,
    planName,
    onPaymentComplete,
    onPaymentError,
    isProcessing,
    setIsProcessing,
}: MockPaymentFormProps) {
    const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
    const [expiry, setExpiry] = useState('12/28')
    const [cvc, setCvc] = useState('123')
    const [name, setName] = useState('')
    const [brand, setBrand] = useState<CardBrand>('visa')
    const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

    useEffect(() => {
        setBrand(getCardBrand(cardNumber))
    }, [cardNumber])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isProcessing) return

        // Basic validation
        const cleanCard = cardNumber.replace(/\s/g, '')
        if (cleanCard.length < 13) {
            onPaymentError('Please enter a valid card number')
            return
        }
        if (expiry.length < 5) {
            onPaymentError('Please enter a valid expiry date')
            return
        }
        if (cvc.length < 3) {
            onPaymentError('Please enter a valid CVC')
            return
        }

        setIsProcessing(true)
        setPaymentState('processing')

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Decline test: card ends in 0000
        if (cleanCard.endsWith('0000')) {
            setPaymentState('error')
            setIsProcessing(false)
            onPaymentError('Your card was declined. Please try a different card.')
            return
        }

        setPaymentState('success')
        // Brief pause to show success animation
        await new Promise(resolve => setTimeout(resolve, 800))
        onPaymentComplete()
    }

    const inputClasses = "w-full bg-peach-100 border border-peach-400/20 rounded-xl px-4 py-3.5 text-olive-600 text-sm font-medium placeholder:text-olive-300/50 focus:outline-none focus:ring-2 focus:ring-terra-400/30 focus:border-terra-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Order summary */}
            <div className="bg-peach-200/40 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <p className="text-olive-600 font-bold">{planName}</p>
                    <p className="text-olive-300 text-xs mt-0.5">One-time payment</p>
                </div>
                <p className="text-2xl font-black text-olive-600 font-mono">${amount}</p>
            </div>

            {/* Card Number */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-olive-400 uppercase tracking-wider">Card Number</label>
                <div className="relative">
                    <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="4242 4242 4242 4242"
                        disabled={isProcessing}
                        className={inputClasses}
                        autoComplete="cc-number"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {brand !== 'unknown' && (
                            <span className="text-[10px] font-black text-terra-400 bg-terra-400/10 px-2 py-0.5 rounded">
                                {BRAND_LABELS[brand]}
                            </span>
                        )}
                        <CreditCard className="w-5 h-5 text-olive-300/40" />
                    </div>
                </div>
            </div>

            {/* Expiry + CVC row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-olive-400 uppercase tracking-wider">Expiry</label>
                    <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        disabled={isProcessing}
                        className={inputClasses}
                        autoComplete="cc-exp"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-olive-400 uppercase tracking-wider">CVC</label>
                    <input
                        type="text"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        disabled={isProcessing}
                        className={inputClasses}
                        autoComplete="cc-csc"
                    />
                </div>
            </div>

            {/* Name on card */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-olive-400 uppercase tracking-wider">Name on Card</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name as shown on card"
                    disabled={isProcessing}
                    className={inputClasses}
                    autoComplete="cc-name"
                />
            </div>

            {/* Pay button */}
            <Button
                type="submit"
                disabled={isProcessing}
                className="w-full h-14 bg-terra-400 text-peach-50 hover:bg-terra-300 font-black tracking-wide text-base rounded-xl transition-all hover:shadow-lg hover:shadow-terra-400/20 disabled:opacity-70 relative overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {paymentState === 'processing' ? (
                        <motion.span
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                        >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            PROCESSING...
                        </motion.span>
                    ) : paymentState === 'success' ? (
                        <motion.span
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            PAYMENT SUCCESSFUL
                        </motion.span>
                    ) : (
                        <motion.span
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            PAY ${amount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </Button>

            {/* Security footer */}
            <div className="flex items-center justify-center gap-2 text-olive-300/50 pt-1">
                <Lock className="w-3 h-3" />
                <span className="text-[10px] font-medium tracking-wider uppercase">Secured with 256-bit encryption</span>
            </div>
        </form>
    )
}
