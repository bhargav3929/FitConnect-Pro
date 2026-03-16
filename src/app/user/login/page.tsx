"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, User, Eye, EyeOff, ArrowLeft } from "lucide-react"
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
        <div className="min-h-screen bg-forest-700 flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold-400/20 via-forest-700 to-forest-700" />

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(rgba(212,162,76,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(212,162,76,0.15) 1px, transparent 1px)`,
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
                                MEMBER<br />
                                ACCESS<br />
                                PORTAL
                            </h1>
                            <p className="text-sage-400 mt-6 max-w-md tracking-wider text-sm">
                                Track your progress, book classes, and manage your membership journey all in one place.
                            </p>
                        </motion.div>
                    </div>

                    {/* Version */}
                    <div className="text-sage-500 text-xs tracking-wider">
                        SOL MEMBER v1.0
                    </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute bottom-0 right-0 w-64 h-64">
                    <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
                        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" fill="none" className="text-sand-200" />
                        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" fill="none" className="text-sand-200" />
                    </svg>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-forest-950">
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
                        <div className="w-16 h-16 bg-sand-200/10 flex items-center justify-center mb-6 rounded-2xl">
                            <User className="w-8 h-8 text-sand-200" />
                        </div>
                        <h2 className="text-3xl font-black text-sand-200 tracking-tight font-display">
                            MEMBER LOGIN
                        </h2>
                        <p className="text-sage-400 mt-2 text-sm tracking-wider">
                            ENTER YOUR CREDENTIALS
                        </p>

                        {/* Test Credentials Hint */}
                        <div className="mt-4 inline-block px-3 py-1 bg-gold-400/5 rounded border border-gold-400/20 text-xs text-gold-400/60 font-mono">
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
                                        <FormLabel className="text-sand-200/70 text-xs font-bold tracking-wider">
                                            USERNAME
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter username"
                                                {...field}
                                                className="h-14 bg-sand-200/5 border-forest-600 text-sand-200 placeholder:text-sage-500 focus:border-gold-400/40 focus:ring-0 rounded-xl"
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
                                        <FormLabel className="text-sand-200/70 text-xs font-bold tracking-wider">
                                            PASSWORD
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="Enter password"
                                                    type={showPassword ? "text" : "password"}
                                                    {...field}
                                                    className="h-14 bg-sand-200/5 border-forest-600 text-sand-200 placeholder:text-sage-500 focus:border-gold-400/40 focus:ring-0 pr-12 rounded-xl"
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
                                className="w-full h-14 bg-gold-400 text-forest-700 font-black text-sm tracking-wider hover:bg-gold-300 transition-all rounded-xl mt-2"
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
                    <div className="mt-8 pt-8 border-t border-forest-600 flex justify-between items-center">
                        <p className="text-sage-500 text-xs tracking-wider">
                            SECURE ACCESS
                        </p>
                        <Link href="/subscription" className="text-sage-400 text-xs tracking-wider hover:text-sand-200 transition-colors font-bold">
                            View Plans →
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
