import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ClientUser, MOCK_CLIENT, CLIENT_CREDENTIALS } from '@/types/client'

interface ClientAuthState {
    isAuthenticated: boolean
    clientUser: ClientUser | null
    loginClient: (username: string, password: string) => boolean
    logoutClient: () => void
}

export const useClientAuthStore = create<ClientAuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            clientUser: null,
            loginClient: (username, password) => {
                if (username === CLIENT_CREDENTIALS.username && password === CLIENT_CREDENTIALS.password) {
                    set({ isAuthenticated: true, clientUser: MOCK_CLIENT })
                    return true
                }
                return false
            },
            logoutClient: () => set({ isAuthenticated: false, clientUser: null }),
        }),
        {
            name: 'client-auth-storage',
        }
    )
)
