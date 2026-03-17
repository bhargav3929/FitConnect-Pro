import { create } from 'zustand';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { AdminUser } from '@/types/admin';

interface AdminAuthState {
    isAdminAuthenticated: boolean;
    isLoading: boolean;
    adminUser: AdminUser | null;
    firebaseUser: FirebaseUser | null;
    initAuth: () => () => void;
    loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logoutAdmin: () => Promise<void>;
}

function mapFirebaseError(code: string): string {
    switch (code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No admin account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Check your connection.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

async function checkAdminClaim(user: FirebaseUser): Promise<boolean> {
    try {
        const tokenResult = await user.getIdTokenResult(true);
        return tokenResult.claims.admin === true;
    } catch {
        return false;
    }
}

function buildAdminUser(firebaseUser: FirebaseUser): AdminUser {
    return {
        uid: firebaseUser.uid,
        role: 'super_admin',
        name: firebaseUser.displayName || 'Admin',
        email: firebaseUser.email || '',
        lastLogin: new Date(),
    };
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
}));
