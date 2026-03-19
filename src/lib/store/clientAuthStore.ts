import { create } from 'zustand'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile,
    User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { ClientUser } from '@/types/client'

interface ClientAuthState {
    isAuthenticated: boolean
    isLoading: boolean
    clientUser: ClientUser | null
    firebaseUser: FirebaseUser | null
    initAuth: () => () => void
    startProfileListener: () => () => void
    loginClient: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
    signupClient: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
    logoutClient: () => Promise<void>
    refreshSubscription: () => Promise<void>
}

const DEFAULT_SUBSCRIPTION: ClientUser['subscription'] = {
    planId: null,
    planCategory: null,
    startDate: null,
    endDate: null,
    status: 'expired',
    classesRemaining: 0,
    maxClassesPerDay: 0,
    advanceBookingDays: 0,
    guestPassesRemaining: 0,
    lastPaymentId: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
}

const DEFAULT_STATS: ClientUser['stats'] = {
    totalClassesAttended: 0,
    currentStreak: 0,
    longestStreak: 0,
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

function toSafeDate(val: unknown): Date | null {
    if (!val) return null
    // Firestore Timestamp
    if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
        return (val as { toDate: () => Date }).toDate()
    }
    // Firestore seconds format { seconds, nanoseconds }
    if (val && typeof val === 'object' && 'seconds' in val) {
        return new Date((val as { seconds: number }).seconds * 1000)
    }
    // String or number
    if (typeof val === 'string' || typeof val === 'number') {
        const d = new Date(val)
        return isNaN(d.getTime()) ? null : d
    }
    if (val instanceof Date) return val
    return null
}

function normalizeSubscription(raw: Record<string, unknown> | undefined): ClientUser['subscription'] {
    if (!raw) return { ...DEFAULT_SUBSCRIPTION }
    return {
        planId: (raw.planId as ClientUser['subscription']['planId']) ?? (raw.planType as ClientUser['subscription']['planId']) ?? null,
        planCategory: (raw.planCategory as ClientUser['subscription']['planCategory']) ?? null,
        startDate: toSafeDate(raw.startDate),
        endDate: toSafeDate(raw.endDate),
        status: (raw.status as ClientUser['subscription']['status']) ?? 'expired',
        classesRemaining: raw.classesRemaining !== undefined ? (raw.classesRemaining as number | null) : 0,
        maxClassesPerDay: (raw.maxClassesPerDay as number) ?? 0,
        advanceBookingDays: (raw.advanceBookingDays as number) ?? 0,
        guestPassesRemaining: (raw.guestPassesRemaining as number) ?? 0,
        lastPaymentId: (raw.lastPaymentId as string) ?? null,
        stripeCustomerId: (raw.stripeCustomerId as string) ?? null,
        stripeSubscriptionId: (raw.stripeSubscriptionId as string) ?? null,
    }
}

function buildClientUser(uid: string, data: Record<string, unknown>): ClientUser {
    return {
        id: (data.id as string) || uid,
        name: (data.name as string) || 'Member',
        email: (data.email as string) || '',
        avatar: data.avatar as string | undefined,
        subscription: normalizeSubscription(data.subscription as Record<string, unknown>),
        stats: {
            totalClassesAttended: (data.stats as Record<string, unknown>)?.totalClassesAttended as number ?? 0,
            currentStreak: (data.stats as Record<string, unknown>)?.currentStreak as number ?? 0,
            longestStreak: (data.stats as Record<string, unknown>)?.longestStreak as number ?? 0,
        },
    }
}

async function fetchClientProfile(uid: string): Promise<ClientUser | null> {
    try {
        const docRef = doc(db, 'users', uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            return buildClientUser(uid, docSnap.data() as Record<string, unknown>)
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
        subscription: { ...DEFAULT_SUBSCRIPTION },
        stats: { ...DEFAULT_STATS },
    }
    try {
        await setDoc(doc(db, 'users', uid), profile)
    } catch {
        // Firestore write may fail if rules aren't set up yet — still return the profile
    }
    return profile
}

function makeFallbackUser(uid: string, displayName: string | null, email: string | null): ClientUser {
    return {
        id: uid,
        name: displayName || 'Member',
        email: email || '',
        subscription: { ...DEFAULT_SUBSCRIPTION },
        stats: { ...DEFAULT_STATS },
    }
}

export const useClientAuthStore = create<ClientAuthState>()((set, get) => ({
    isAuthenticated: false,
    isLoading: true,
    clientUser: null,
    firebaseUser: null,

    initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const profile = await fetchClientProfile(firebaseUser.uid)
                const clientUser: ClientUser = profile || makeFallbackUser(firebaseUser.uid, firebaseUser.displayName, firebaseUser.email)
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

    // Real-time Firestore listener — keeps clientUser in sync with DB at all times.
    // When the booking API decrements classesRemaining in Firestore, this listener
    // fires and updates the Zustand store automatically within ~1 second.
    startProfileListener: () => {
        const { firebaseUser } = get()
        if (!firebaseUser) return () => {}
        const userRef = doc(db, 'users', firebaseUser.uid)
        const unsub: Unsubscribe = onSnapshot(userRef, (snap) => {
            if (!snap.exists()) return
            const data = snap.data() as Record<string, unknown>
            const updated = buildClientUser(firebaseUser.uid, data)
            set({ clientUser: updated })
        })
        return unsub
    },

    loginClient: async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password)
            const profile = await fetchClientProfile(result.user.uid)
            const clientUser: ClientUser = profile || makeFallbackUser(result.user.uid, result.user.displayName, result.user.email)
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

    refreshSubscription: async () => {
        const { firebaseUser } = get()
        if (!firebaseUser) return
        const profile = await fetchClientProfile(firebaseUser.uid)
        if (profile) {
            set({ clientUser: profile })
        }
    },
}))
