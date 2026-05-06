"use client"

import { Suspense } from "react"
import { UserLoginContent } from "./login-content"

export default function UserLoginPage() {
    return (
        <Suspense fallback={<LoginLoadingFallback />}>
            <UserLoginContent />
        </Suspense>
    )
}

function LoginLoadingFallback() {
    return (
        <div className="min-h-screen bg-peach-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-peach-400/30 border-t-terra-400 rounded-full animate-spin" />
                <p className="text-olive-300 text-sm tracking-wider">LOADING...</p>
            </div>
        </div>
    )
}
