import { create } from 'zustand';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { AdminUser } from '../types/admin';
import { mapFirebaseError, buildAdminUser } from './adminAuthStore.helpers';

interface AdminAuthState {
    isAdminAuthenticated: boolean;
    isLoading: boolean;
    adminUser: AdminUser | null;
    firebaseUser: FirebaseUser | null;
    initAuth: () => () => void;
    loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logoutAdmin: () => Promise<void>;
    updateAdminName: (name: string) => void;
}

async function checkAdminClaim(user: FirebaseUser): Promise<boolean> {
    try {
        const tokenResult = await user.getIdTokenResult(true);
        return tokenResult.claims.admin === true;
    } catch {
        return false;
    }
}

export const useAdminAuthStore = create<AdminAuthState>()((set) => ({
    isAdminAuthenticated: false,
    isLoading: true,
    adminUser: null,
    firebaseUser: null,

    initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const isAdmin = await checkAdminClaim(firebaseUser);
                if (isAdmin) {
                    set({
                        isAdminAuthenticated: true,
                        isLoading: false,
                        adminUser: buildAdminUser(firebaseUser),
                        firebaseUser,
                    });
                } else {
                    set({
                        isAdminAuthenticated: false,
                        isLoading: false,
                        adminUser: null,
                        firebaseUser: null,
                    });
                }
            } else {
                set({
                    isAdminAuthenticated: false,
                    isLoading: false,
                    adminUser: null,
                    firebaseUser: null,
                });
            }
        });
        return unsubscribe;
    },

    loginAdmin: async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const isAdmin = await checkAdminClaim(result.user);
            if (!isAdmin) {
                await signOut(auth);
                return {
                    success: false,
                    error: 'Access denied. This account does not have admin privileges.',
                };
            }
            set({
                isAdminAuthenticated: true,
                adminUser: buildAdminUser(result.user),
                firebaseUser: result.user,
            });
            return { success: true };
        } catch (err: unknown) {
            const code = (err as { code?: string }).code || '';
            return { success: false, error: mapFirebaseError(code) };
        }
    },

    logoutAdmin: async () => {
        await signOut(auth);
        set({
            isAdminAuthenticated: false,
            adminUser: null,
            firebaseUser: null,
        });
    },

    updateAdminName: (name: string) => {
        set((state) => ({
            adminUser: state.adminUser ? { ...state.adminUser, name } : null,
        }));
    },
}));
