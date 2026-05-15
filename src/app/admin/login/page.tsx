"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Shield, Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { COLORS, withAlpha } from "@fitconnect/shared/theme"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAdminAuthStore } from "@fitconnect/shared/stores/adminAuthStore"
import { toast } from "sonner"

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
})

export default function AdminLoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const { loginAdmin } = useAdminAuthStore()

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsLoading(true)

        const result = await loginAdmin(values.email, values.password)

        if (result.success) {
            toast.success("Welcome back, Admin!")
            router.push('/admin/dashboard')
        } else {
            toast.error("Authentication failed", {
                description: result.error,
            })
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-peach-200 flex">
            {/* Left Panel - Decorative (dark is appropriate here as a feature panel) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-terra-400/20 via-warmDark-800 to-warmDark-900" />

                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(${withAlpha(COLORS.dark.text, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(COLORS.dark.text, 0.06)} 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />

                <div className="relative z-10 flex flex-col justify-between p-16">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <ArrowLeft className="w-5 h-5 text-peach-400 group-hover:text-peach-200 transition-colors" />
                            <Image src="/images/sol-logo-terra.png" alt="SOL Pilates Studio" width={400} height={400} className="h-16 w-auto" />
                        </Link>
                    </div>

                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-6xl font-black text-peach-200 leading-tight tracking-normal mt-4 font-display">
                                ADMIN<br />
                                CONTROL<br />
                                CENTER
                            </h1>
                            <p className="text-peach-400 mt-6 max-w-md tracking-wider text-sm">
                                Access the complete business management dashboard. Control classes, facility settings, trainers, and view comprehensive analytics.
                            </p>
                        </motion.div>
                    </div>

                    <div className="text-peach-400/50 text-xs tracking-wider">
                        SOL ADMIN v1.0
                    </div>
                </div>

                <div className="absolute bottom-0 right-0 w-64 h-64">
                    <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
                        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" fill="none" className="text-peach-200" />
                        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" fill="none" className="text-peach-200" />
                        <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1" fill="none" className="text-peach-200" />
                    </svg>
                </div>
            </div>

            {/* Right Panel - Login Form (LIGHT) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-peach-100">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-12">
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <ArrowLeft className="w-5 h-5 text-olive-400 group-hover:text-olive-600 transition-colors" />
                            <Image src="/images/sol-logo-terra.png" alt="SOL Pilates Studio" width={400} height={400} className="h-16 w-auto" />
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-10">
                        <div className="w-16 h-16 bg-terra-400/10 flex items-center justify-center mb-6">
                            <Shield className="w-8 h-8 text-terra-400" />
                        </div>
                        <h2 className="text-3xl font-black text-olive-600 tracking-normal font-display">
                            ADMIN LOGIN
                        </h2>
                        <p className="text-olive-300 mt-2 text-sm tracking-wider">
                            ENTER YOUR CREDENTIALS TO ACCESS THE DASHBOARD
                        </p>
                    </div>

                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-olive-600 text-xs font-bold tracking-wider">
                                            EMAIL
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300/60" />
                                                <Input
                                                    placeholder="admin@solpilates.com"
                                                    type="email"
                                                    {...field}
                                                    className="h-14 bg-peach-50 border-peach-400/30 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400 focus:ring-0 pl-11"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-olive-600 text-xs font-bold tracking-wider">
                                            PASSWORD
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300/60" />
                                                <Input
                                                    placeholder="Enter password"
                                                    type={showPassword ? "text" : "password"}
                                                    {...field}
                                                    className="h-14 bg-peach-50 border-peach-400/30 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400 focus:ring-0 pl-11 pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-olive-300/60 hover:text-olive-600 transition-colors"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-5 h-5" />
                                                    ) : (
                                                        <Eye className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full h-14 bg-terra-400 text-peach-50 font-black text-sm tracking-wider hover:bg-terra-300 transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        AUTHENTICATING...
                                    </>
                                ) : (
                                    "SIGN IN"
                                )}
                            </Button>
                        </form>
                    </Form>

                    {/* Footer */}
                    <div className="mt-8 pt-8 border-t border-peach-400/20">
                        <p className="text-olive-300/60 text-xs text-center tracking-wider">
                            SECURE ADMIN ACCESS &bull; SOL PILATES &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
