"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Shield, Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"

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
    username: z.string().min(1, "Username is required"),
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
            username: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsLoading(true)

        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800))

        const success = loginAdmin(values.username, values.password)

        if (success) {
            toast.success("Welcome back, Admin!")
            router.push('/admin/dashboard')
        } else {
            toast.error("Invalid credentials")
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-black flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#7BA3A8]/30 via-black to-black" />

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-16">
                    {/* Logo */}
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                            <span className="text-2xl font-black tracking-wider text-white">FITPRO</span>
                        </Link>
                    </div>

                    {/* Main Text */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-white/50 text-4xl font-light">+</span>
                            <h1 className="text-6xl font-black text-white leading-tight tracking-tight mt-4">
                                ADMIN<br />
                                CONTROL<br />
                                CENTER
                            </h1>
                            <p className="text-white/50 mt-6 max-w-md tracking-wider text-sm">
                                Access the complete business management dashboard. Control classes, locations, trainers, and view comprehensive analytics.
                            </p>
                        </motion.div>
                    </div>

                    {/* Version */}
                    <div className="text-white/30 text-xs tracking-wider">
                        FITPRO ADMIN v1.0
                    </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute bottom-0 right-0 w-64 h-64">
                    <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
                        <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1" fill="none" />
                        <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="1" fill="none" />
                        <circle cx="100" cy="100" r="40" stroke="white" strokeWidth="1" fill="none" />
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
                            <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                            <span className="text-2xl font-black tracking-wider text-white">FITPRO</span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-10">
                        <div className="w-16 h-16 bg-white/10 flex items-center justify-center mb-6">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            ADMIN LOGIN
                        </h2>
                        <p className="text-white/50 mt-2 text-sm tracking-wider">
                            ENTER YOUR CREDENTIALS TO ACCESS THE DASHBOARD
                        </p>
                    </div>

                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white/70 text-xs font-bold tracking-wider">
                                            USERNAME
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter username"
                                                {...field}
                                                className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                                            />
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
                                        <FormLabel className="text-white/70 text-xs font-bold tracking-wider">
                                            PASSWORD
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="Enter password"
                                                    type={showPassword ? "text" : "password"}
                                                    {...field}
                                                    className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0 pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
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
                                className="w-full h-14 bg-white text-black font-black text-sm tracking-wider hover:bg-white/90 transition-all"
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
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <p className="text-white/30 text-xs text-center tracking-wider">
                            SECURE ADMIN ACCESS • FITPRO © 2024
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
