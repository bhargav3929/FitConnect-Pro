"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useClientAuthStore } from "@/lib/store/clientAuthStore"
import { UserNav } from "@/components/user/UserNav"

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, isLoading, initAuth } = useClientAuthStore()
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = initAuth()
        return () => unsubscribe()
    }, [initAuth])

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/user/login')
        }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-peach-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-peach-400/30 border-t-terra-400 rounded-full animate-spin" />
                    <p className="text-olive-300 text-sm tracking-wider">LOADING...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen bg-peach-100 text-olive-600">
            <UserNav />
            <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0">
                <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
