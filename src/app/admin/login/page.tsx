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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAdminAuthStore } from "@/lib/store/adminAuthStore"
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
        <div className="min-h-screen bg-forest-700 flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-terracotta-400/30 via-forest-700 to-forest-700" />

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(rgba(237,230,218,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(237,230,218,0.08) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-16">
                    {/* Logo */}
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <ArrowLeft className="w-5 h-5 text-sage-400 group-hover:text-sand-200 transition-colors" />
                            <Image src="/images/sol-logo-cream.png" alt="SOL Pilates Studio" width={400} height={400} className="h-16 w-auto" />
                        </Link>
                    </div>

                    {/* Main Text */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-sage-400 text-4xl font-light">+</span>
                            <h1 className="text-6xl font-black text-sand-200 leading-tight tracking-tight mt-4 font-display">
                                ADMIN<br />
                                CONTROL<br />
                                CENTER
                            </h1>
                            <p className="text-sage-400 mt-6 max-w-md tracking-wider text-sm">
                                Access the complete business management dashboard. Control classes, facility settings, trainers, and view comprehensive analytics.
                            </p>
                        </motion.div>
                    </div>

                    {/* Version */}
                    <div className="text-sage-500 text-xs tracking-wider">
                        SOL ADMIN v1.0
                    </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute bottom-0 right-0 w-64 h-64">
                    <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
                        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" fill="none" className="text-sand-200" />
                        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" fill="none" className="text-sand-200" />
                        <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1" fill="none" className="text-sand-200" />
                    </svg>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-12">
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <ArrowLeft className="w-5 h-5 text-sage-400 group-hover:text-sand-200 transition-colors" />
                            <Image src="/images/sol-logo-cream.png" alt="SOL Pilates Studio" width={400} height={400} className="h-16 w-auto" />
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-10">
                        <div className="w-16 h-16 bg-sand-200/10 flex items-center justify-center mb-6">
                            <Shield className="w-8 h-8 text-sand-200" />
                        </div>
                        <h2 className="text-3xl font-black text-sand-200 tracking-tight font-display">
                            ADMIN LOGIN
                        </h2>
                        <p className="text-sage-400 mt-2 text-sm tracking-wider">
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
                                        <FormLabel className="text-sand-200/70 text-xs font-bold tracking-wider">
                                            EMAIL
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-500" />
                                                <Input
                                                    placeholder="admin@solpilates.com"
                                                    type="email"
                                                    {...field}
                                                    className="h-14 bg-sand-200/5 border-forest-600 text-sand-200 placeholder:text-sage-500 focus:border-gold-400/50 focus:ring-0 pl-11"
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
                                        <FormLabel className="text-sand-200/70 text-xs font-bold tracking-wider">
                                            PASSWORD
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-500" />
                                                <Input
                                                    placeholder="Enter password"
                                                    type={showPassword ? "text" : "password"}
                                                    {...field}
                                                    className="h-14 bg-sand-200/5 border-forest-600 text-sand-200 placeholder:text-sage-500 focus:border-gold-400/50 focus:ring-0 pl-11 pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sage-500 hover:text-sand-200/70 transition-colors"
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
                                className="w-full h-14 bg-gold-400 text-forest-700 font-black text-sm tracking-wider hover:bg-gold-300 transition-all"
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
                    <div className="mt-8 pt-8 border-t border-forest-600">
                        <p className="text-sage-500 text-xs text-center tracking-wider">
                            SECURE ADMIN ACCESS &bull; SOL PILATES &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
