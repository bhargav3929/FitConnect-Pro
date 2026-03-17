"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, User, Eye, EyeOff, ArrowLeft, Mail, Lock, UserPlus } from "lucide-react"
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
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
})

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type LoginValues = z.infer<typeof loginSchema>
type SignupValues = z.infer<typeof signupSchema>

export default function UserLoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
    const router = useRouter()
    const { loginClient, signupClient } = useClientAuthStore()

    const loginForm = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    })

    const signupForm = useForm<SignupValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    })

    async function onLogin(values: LoginValues) {
        setIsLoading(true)
        const result = await loginClient(values.email, values.password)
        if (result.success) {
            toast.success("Welcome back!", {
                description: "Successfully logged in to your member account.",
            })
            router.push('/user/dashboard')
        } else {
            toast.error("Login failed", {
                description: result.error,
            })
        }
        setIsLoading(false)
    }

    async function onSignup(values: SignupValues) {
        setIsLoading(true)
        const result = await signupClient(values.email, values.password, values.name)
        if (result.success) {
            toast.success("Account created!", {
                description: "Welcome to SOL Pilates Studio.",
            })
            router.push('/user/dashboard')
        } else {
            toast.error("Signup failed", {
                description: result.error,
            })
        }
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-peach-200 flex">
            {/* Left Panel - Decorative (dark feature panel) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-terra-400/15 via-warmDark-800 to-warmDark-900" />

                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(rgba(212,180,148,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(212,180,148,0.10) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />

                <div className="relative z-10 flex flex-col justify-between p-16">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <ArrowLeft className="w-5 h-5 text-peach-400 group-hover:text-peach-200 transition-colors" />
                            <Image src="/images/sol-logo-cream.png" alt="SOL Pilates Studio" width={400} height={400} className="h-16 w-auto" />
                        </Link>
                    </div>

                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-terra-400 text-4xl font-light">+</span>
                            <h1 className="text-6xl font-black text-peach-200 leading-tight tracking-tight mt-4 font-display">
                                MEMBER<br />
                                ACCESS<br />
                                PORTAL
                            </h1>
                            <p className="text-peach-400 mt-6 max-w-md tracking-wider text-sm">
                                Track your progress, book classes, and manage your membership journey all in one place.
                            </p>
                        </motion.div>
                    </div>

                    <div className="text-peach-400/50 text-xs tracking-wider">
                        SOL MEMBER v1.0
                    </div>
                </div>

                <div className="absolute bottom-0 right-0 w-64 h-64">
                    <svg viewBox="0 0 200 200" className="w-full h-full opacity-10">
                        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" fill="none" className="text-peach-200" />
                        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" fill="none" className="text-peach-200" />
                    </svg>
                </div>
            </div>

            {/* Right Panel - Login/Signup Form (LIGHT) */}
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
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-terra-400/10 flex items-center justify-center mb-6">
                            {activeTab === 'login' ? (
                                <User className="w-8 h-8 text-terra-400" />
                            ) : (
                                <UserPlus className="w-8 h-8 text-terra-400" />
                            )}
                        </div>
                        <h2 className="text-3xl font-black text-olive-600 tracking-tight font-display">
                            {activeTab === 'login' ? 'MEMBER LOGIN' : 'CREATE ACCOUNT'}
                        </h2>
                        <p className="text-olive-300 mt-2 text-sm tracking-wider">
                            {activeTab === 'login' ? 'SIGN IN TO YOUR ACCOUNT' : 'JOIN SOL PILATES STUDIO'}
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex mb-8 bg-peach-300/50 p-1">
                        <button
                            onClick={() => { setActiveTab('login'); setShowPassword(false) }}
                            className={`flex-1 py-3 text-xs font-bold tracking-wider transition-all ${
                                activeTab === 'login'
                                    ? 'bg-terra-400 text-peach-50'
                                    : 'text-olive-400 hover:text-olive-600'
                            }`}
                        >
                            SIGN IN
                        </button>
                        <button
                            onClick={() => { setActiveTab('signup'); setShowPassword(false) }}
                            className={`flex-1 py-3 text-xs font-bold tracking-wider transition-all ${
                                activeTab === 'signup'
                                    ? 'bg-terra-400 text-peach-50'
                                    : 'text-olive-400 hover:text-olive-600'
                            }`}
                        >
                            SIGN UP
                        </button>
                    </div>

                    {/* Forms */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'login' ? (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Form {...loginForm}>
                                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                                        <FormField
                                            control={loginForm.control}
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
                                                                placeholder="you@example.com"
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
                                            control={loginForm.control}
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
                                            className="w-full h-14 bg-terra-400 text-peach-50 font-black text-sm tracking-wider hover:bg-terra-300 transition-all mt-2"
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
                            </motion.div>
                        ) : (
                            <motion.div
                                key="signup"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Form {...signupForm}>
                                    <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-5">
                                        <FormField
                                            control={signupForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-olive-600 text-xs font-bold tracking-wider">
                                                        FULL NAME
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300/60" />
                                                            <Input
                                                                placeholder="Your full name"
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
                                            control={signupForm.control}
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
                                                                placeholder="you@example.com"
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
                                            control={signupForm.control}
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
                                                                placeholder="At least 6 characters"
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
                                        <FormField
                                            control={signupForm.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-olive-600 text-xs font-bold tracking-wider">
                                                        CONFIRM PASSWORD
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300/60" />
                                                            <Input
                                                                placeholder="Repeat password"
                                                                type={showPassword ? "text" : "password"}
                                                                {...field}
                                                                className="h-14 bg-peach-50 border-peach-400/30 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400 focus:ring-0 pl-11"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            className="w-full h-14 bg-terra-400 text-peach-50 font-black text-sm tracking-wider hover:bg-terra-300 transition-all mt-2"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    CREATING ACCOUNT...
                                                </>
                                            ) : (
                                                "CREATE ACCOUNT"
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="mt-8 pt-8 border-t border-peach-400/20 flex justify-between items-center">
                        <p className="text-olive-300/60 text-xs tracking-wider">
                            SECURE ACCESS
                        </p>
                        <Link href="/subscription" className="text-terra-400 text-xs tracking-wider hover:text-terra-300 transition-colors font-bold">
                            View Plans →
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
