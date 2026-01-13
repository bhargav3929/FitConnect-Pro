import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminUser, ADMIN_CREDENTIALS, DEFAULT_ADMIN_USER } from '@/types/admin';

interface AdminAuthState {
    isAdminAuthenticated: boolean;
    adminUser: AdminUser | null;
    loginAdmin: (username: string, password: string) => boolean;
    logoutAdmin: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
    persist(
        (set) => ({
            isAdminAuthenticated: false,
            adminUser: null,
            loginAdmin: (username: string, password: string) => {
                if (
                    username === ADMIN_CREDENTIALS.username &&
                    password === ADMIN_CREDENTIALS.password
                ) {
                    set({
                        isAdminAuthenticated: true,
                        adminUser: {
                            ...DEFAULT_ADMIN_USER,
                            lastLogin: new Date(),
                        },
                    });
                    return true;
                }
                return false;
            },
            logoutAdmin: () => {
                set({
                    isAdminAuthenticated: false,
                    adminUser: null,
                });
            },
        }),
        {
            name: 'admin-auth-storage',
        }
    )
);
