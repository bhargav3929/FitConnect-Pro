"use client"

import { createContext, useContext, useState } from "react"
import { useRouter } from "next/navigation"

const STORAGE_KEY = "sol_site_gate_ok"

const AdminContext = createContext<{ isAdmin: boolean }>({ isAdmin: false })
export const useIsAdmin = () => useContext(AdminContext).isAdmin

function hasStoredAccess() {
    return typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1"
}

export function SitePasswordGate({ children }: { children: React.ReactNode }) {
    const [authed, setAuthed] = useState(hasStoredAccess)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()

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
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-warmDark-900 text-peach-50 gap-8 px-6">
            <p className="type-eyebrow animate-pulse">
                Loading
            </p>
            <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="bg-peach-50/5 border border-peach-50/10 px-4 py-3 text-sm text-peach-50 placeholder:text-peach-200/50 focus:outline-none focus:border-terra-400"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="bg-peach-50/5 border border-peach-50/10 px-4 py-3 text-sm text-peach-50 placeholder:text-peach-200/50 focus:outline-none focus:border-terra-400"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                    type="submit"
                    className="bg-terra-400 text-peach-50 text-sm font-bold tracking-wider uppercase py-3 hover:bg-terra-300 transition-colors"
                >
                    Enter
                </button>
            </form>
        </div>
    )
}
