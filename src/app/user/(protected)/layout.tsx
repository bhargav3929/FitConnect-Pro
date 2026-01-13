"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useClientAuthStore } from "@/lib/store/clientAuthStore"
import { UserNav } from "@/components/user/UserNav"
import { Loader2 } from "lucide-react"

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated } = useClientAuthStore()
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // Short delay to allow hydration
        const timer = setTimeout(() => {
            if (!isAuthenticated) {
                router.push('/user/login')
            }
            setIsChecking(false)
        }, 100)
        return () => clearTimeout(timer)
    }, [isAuthenticated, router])

    if (isChecking) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen bg-black text-white">
            <UserNav />
            <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0">
                <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
