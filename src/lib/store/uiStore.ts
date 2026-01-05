import { create } from 'zustand'

interface UIState {
    isSidebarOpen: boolean
    toggleSidebar: () => void
    setSidebarOpen: (isOpen: boolean) => void

    // Modal states could go here if we wanted global control, 
    // but local state + context is often better for modals to keep them atomic.
    // For now, we'll keep it simple as per requirements.
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: false,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}))
