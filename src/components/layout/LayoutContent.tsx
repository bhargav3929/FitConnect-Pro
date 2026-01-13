"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    // Check if we're on an admin or user dashboard page
    const isDashboardPage = pathname?.startsWith('/admin') || pathname?.startsWith('/user')

    // For dashboard pages, render without navbar/footer
    if (isDashboardPage) {
        return <>{children}</>
    }

    // For public pages, render with navbar and footer
    return (
        <>
            <Header />
            <main className="min-h-screen pt-[72px]">
                {children}
            </main>
            <Footer />
        </>
    )
}
