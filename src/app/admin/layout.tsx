"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAdminAuthStore } from "@/lib/store/adminAuthStore"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAdminAuthenticated } = useAdminAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Don't redirect if on the login page
        if (pathname === '/admin/login') return

        if (!isAdminAuthenticated) {
            router.push('/admin/login')
        }
    }, [isAdminAuthenticated, router, pathname])

    // Show login page without admin layout
    if (pathname === '/admin/login') {
        return <>{children}</>
    }

    // Show nothing while checking auth
    if (!isAdminAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#F0F2F5]/20 border-t-coral-400 rounded-full animate-spin" />
                    <p className="text-[#8892A4] text-sm tracking-wider">LOADING...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0B0F19]">
            <AdminSidebar />
            <div className="lg:pl-72">
                <AdminHeader />
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
