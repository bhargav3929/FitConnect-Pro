import { create } from 'zustand'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile,
    User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { ClientUser } from '@/types/client'

interface ClientAuthState {
    isAuthenticated: boolean
    isLoading: boolean
    clientUser: ClientUser | null
    firebaseUser: FirebaseUser | null
    initAuth: () => () => void
    loginClient: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
    signupClient: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
    logoutClient: () => Promise<void>
}

function mapFirebaseError(code: string): string {
    switch (code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.'
        case 'auth/user-disabled':
            return 'This account has been disabled. Contact support.'
        case 'auth/user-not-found':
            return 'No account found with this email.'
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.'
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.'
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.'
        case 'auth/weak-password':
            return 'Password must be at least 6 characters.'
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.'
        case 'auth/network-request-failed':
            return 'Network error. Check your connection.'
        default:
            return 'An unexpected error occurred. Please try again.'
    }
}

async function fetchClientProfile(uid: string): Promise<ClientUser | null> {
    try {
        const docRef = doc(db, 'users', uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            return docSnap.data() as ClientUser
        }
        return null
    } catch {
        return null
    }
}

async function createClientProfile(uid: string, email: string, name: string): Promise<ClientUser> {
    const profile: ClientUser = {
        id: uid,
        name,
        email,
        subscription: {
            planType: null,
            startDate: null,
            endDate: null,
            status: 'active',
            classesRemaining: 0,
        },
        stats: {
            totalClassesAttended: 0,
            currentStreak: 0,
            longestStreak: 0,
        },
    }
    try {
        await setDoc(doc(db, 'users', uid), profile)
    } catch {
        // Firestore write may fail if rules aren't set up yet — still return the profile
    }
    return profile
}

export const useClientAuthStore = create<ClientAuthState>()((set) => ({
    isAuthenticated: false,
    isLoading: true,
    clientUser: null,
    firebaseUser: null,

    initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const profile = await fetchClientProfile(firebaseUser.uid)
                const clientUser: ClientUser = profile || {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Member',
                    email: firebaseUser.email || '',
                    subscription: { planType: null, startDate: null, endDate: null, status: 'active', classesRemaining: 0 },
                    stats: { totalClassesAttended: 0, currentStreak: 0, longestStreak: 0 },
                }
                set({
                    isAuthenticated: true,
                    isLoading: false,
                    clientUser,
                    firebaseUser,
                })
            } else {
                set({
                    isAuthenticated: false,
                    isLoading: false,
                    clientUser: null,
                    firebaseUser: null,
                })
            }
        })
        return unsubscribe
    },

    loginClient: async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password)
            const profile = await fetchClientProfile(result.user.uid)
            const clientUser: ClientUser = profile || {
                id: result.user.uid,
                name: result.user.displayName || 'Member',
                email: result.user.email || '',
                subscription: { planType: null, startDate: null, endDate: null, status: 'active', classesRemaining: 0 },
                stats: { totalClassesAttended: 0, currentStreak: 0, longestStreak: 0 },
            }
            set({
                isAuthenticated: true,
                clientUser,
                firebaseUser: result.user,
            })
            return { success: true }
        } catch (err: unknown) {
            const code = (err as { code?: string }).code || ''
            return { success: false, error: mapFirebaseError(code) }
        }
    },

    signupClient: async (email, password, name) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password)
            await updateProfile(result.user, { displayName: name })
            const clientUser = await createClientProfile(result.user.uid, email, name)
            set({
                isAuthenticated: true,
                clientUser,
                firebaseUser: result.user,
            })
            return { success: true }
        } catch (err: unknown) {
            const code = (err as { code?: string }).code || ''
            return { success: false, error: mapFirebaseError(code) }
        }
    },

    logoutClient: async () => {
        await signOut(auth)
        set({
            isAuthenticated: false,
            clientUser: null,
            firebaseUser: null,
        })
    },
}))
