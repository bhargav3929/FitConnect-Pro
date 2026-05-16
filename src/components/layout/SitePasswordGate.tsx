"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const STORAGE_KEY = "sol_site_gate_ok"

const AdminContext = createContext<{ isAdmin: boolean }>({ isAdmin: false })
export const useIsAdmin = () => useContext(AdminContext).isAdmin

export function SitePasswordGate({ children }: { children: React.ReactNode }) {
    const [authed, setAuthed] = useState<boolean | null>(null)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        setAuthed(typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1")
    }, [])

    if (authed === null) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0F19] text-white">
                <p className="text-sm font-semibold tracking-[0.32em] uppercase text-[#DA6027] animate-pulse">
                    Loading
                </p>
            </div>
        )
    }

    if (authed) return <AdminContext.Provider value={{ isAdmin: true }}>{children}</AdminContext.Provider>

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (username === "admin" && password === "admin123") {
            sessionStorage.setItem(STORAGE_KEY, "1")
            setAuthed(true)
            router.push("/")
        } else {
            setError("Invalid credentials")
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F19] text-white gap-8 px-6">
            <p className="text-sm font-semibold tracking-[0.32em] uppercase text-[#DA6027] animate-pulse">
                Loading
            </p>
            <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#DA6027]"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#DA6027]"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                    type="submit"
                    className="bg-[#DA6027] text-white text-sm font-bold tracking-wider uppercase py-3 rounded-md hover:bg-[#E8834A] transition-colors"
                >
                    Enter
                </button>
            </form>
        </div>
    )
}
