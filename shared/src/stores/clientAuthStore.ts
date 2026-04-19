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
import { auth, db } from '../firebase/config'
import { ClientUser } from '../types/client'
import {
    DEFAULT_SUBSCRIPTION,
    DEFAULT_STATS,
    mapFirebaseError,
    buildClientUser,
    makeFallbackUser,
} from './clientAuthStore.helpers'

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
