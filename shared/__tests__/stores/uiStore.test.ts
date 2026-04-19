import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../src/stores/uiStore';

describe('useUIStore', () => {
    beforeEach(() => {
        // Reset the store to initial state before each test
        useUIStore.setState({ isSidebarOpen: false });
    });

    it('has sidebar closed by default', () => {
        const state = useUIStore.getState();
        expect(state.isSidebarOpen).toBe(false);
    });

    it('toggleSidebar opens the sidebar', () => {
        useUIStore.getState().toggleSidebar();
        expect(useUIStore.getState().isSidebarOpen).toBe(true);
    });

    it('toggleSidebar toggles back to closed', () => {
        useUIStore.getState().toggleSidebar();
        useUIStore.getState().toggleSidebar();
        expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });

    it('setSidebarOpen(true) opens the sidebar', () => {
        useUIStore.getState().setSidebarOpen(true);
        expect(useUIStore.getState().isSidebarOpen).toBe(true);
    });

    it('setSidebarOpen(false) closes the sidebar', () => {
        useUIStore.getState().setSidebarOpen(true);
        useUIStore.getState().setSidebarOpen(false);
        expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });

    it('setSidebarOpen(false) is idempotent when already closed', () => {
        useUIStore.getState().setSidebarOpen(false);
        expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });

    it('setSidebarOpen(true) is idempotent when already open', () => {
        useUIStore.getState().setSidebarOpen(true);
        useUIStore.getState().setSidebarOpen(true);
        expect(useUIStore.getState().isSidebarOpen).toBe(true);
    });
});
