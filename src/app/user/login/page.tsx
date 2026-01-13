"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, User, Eye, EyeOff, ArrowLeft } from "lucide-react"
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
import { useClientAuthStore } from "@/lib/store/clientAuthStore"
import { toast } from "sonner"

const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
})

export default function UserLoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const { loginClient } = useClientAuthStore()

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

        const success = loginClient(values.username, values.password)

        if (success) {
            toast.success("Welcome back!", {
                description: "Successfully logged in to your member account.",
            })
            router.push('/user/dashboard')
        } else {
            toast.error("Invalid credentials", {
                description: "Try user: client / pass: client123",
            })
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-black flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Gradient Background - Different hue for Members (Cyan/Teal) vs Admin (Green/Black) */}
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
                                MEMBER<br />
                                ACCESS<br />
                                PORTAL
                            </h1>
                            <p className="text-white/50 mt-6 max-w-md tracking-wider text-sm">
                                Track your progress, book classes, and manage your membership journey all in one place.
                            </p>
                        </motion.div>
                    </div>

                    {/* Version */}
                    <div className="text-white/30 text-xs tracking-wider">
                        FITPRO MEMBER v1.0
                    </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute bottom-0 right-0 w-64 h-64">
                    <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
                        <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1" fill="none" />
                        <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="1" fill="none" />
                        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    </svg>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#050505]">
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
                        <div className="w-16 h-16 bg-white/10 flex items-center justify-center mb-6 rounded-2xl">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            MEMBER LOGIN
                        </h2>
                        <p className="text-white/50 mt-2 text-sm tracking-wider">
                            ENTER YOUR CREDENTIALS
                        </p>

                        {/* Test Credentials Hint */}
                        <div className="mt-4 inline-block px-3 py-1 bg-white/5 rounded border border-white/10 text-xs text-white/40 font-mono">
                            user: client / pass: client123
                        </div>
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
                                                className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0 rounded-xl"
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
                                                    className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0 pr-12 rounded-xl"
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
                                className="w-full h-14 bg-white text-black font-black text-sm tracking-wider hover:bg-neutral-200 transition-all rounded-xl mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        VERIFYING...
                                    </>
                                ) : (
                                    "SIGN IN"
                                )}
                            </Button>
                        </form>
                    </Form>

                    {/* Footer */}
                    <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                        <p className="text-white/30 text-xs tracking-wider">
                            SECURE ACCESS
                        </p>
                        <Link href="/subscription" className="text-white/50 text-xs tracking-wider hover:text-white transition-colors font-bold">
                            Vew Plans →
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
