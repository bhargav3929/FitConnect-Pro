"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Phone } from "lucide-react"
import { toast } from "sonner"
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore"
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@fitconnect/shared/utils/phone"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * Collects a mobile number from members who never passed through the signup form:
 * Google sign-ups, and members who joined before the number was required.
 *
 * Rendered by the protected layout in place of the page, so it cannot be skipped.
 */
export function PhoneCaptureGate() {
    const { savePhone, clientUser } = useClientAuthStore()
    const [phone, setPhone] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function onSubmit(event: React.FormEvent) {
        event.preventDefault()
        if (!isValidPhone(phone)) {
            setError(PHONE_VALIDATION_MESSAGE)
            return
        }

        setError(null)
        setIsSaving(true)
        const result = await savePhone(phone)
        setIsSaving(false)

        if (result.success) {
            toast.success("Thanks!", { description: "Your number has been saved." })
        } else {
            setError(result.error ?? "Could not save your number. Please try again.")
        }
    }

    const firstName = clientUser?.name?.split(" ")[0]

    return (
        <div className="min-h-screen bg-peach-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md bg-peach-50 border border-peach-400/30 p-8"
            >
                <div className="w-12 h-12 bg-terra-400/10 flex items-center justify-center mb-6">
                    <Phone className="w-5 h-5 text-terra-400" />
                </div>

                <h1 className="text-3xl font-extrabold text-olive-600 tracking-tight mb-3">
                    One more step
                </h1>
                <p className="text-sm font-light text-olive-400 mb-8 leading-relaxed">
                    {firstName ? `${firstName}, we ` : "We "}need a mobile number so the studio can reach
                    you about your bookings and any last-minute schedule changes.
                </p>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="phone" className="block text-olive-600 text-xs font-bold tracking-wider mb-2">
                            MOBILE NUMBER
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300/60" />
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value)
                                    if (error) setError(null)
                                }}
                                placeholder="98765 43210"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                autoFocus
                                aria-invalid={!!error}
                                aria-describedby={error ? "phone-error" : undefined}
                                className="h-14 bg-peach-100 border-peach-400/30 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400 focus:ring-0 pl-11"
                            />
                        </div>
                        {error && (
                            <p id="phone-error" className="mt-2 text-xs font-medium text-terra-500">
                                {error}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full h-14 bg-terra-400 hover:bg-terra-500 text-peach-50 font-bold tracking-wider disabled:opacity-60"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "CONTINUE"}
                    </Button>
                </form>
            </motion.div>
        </div>
    )
}
