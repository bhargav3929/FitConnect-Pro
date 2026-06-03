import { ClientUser } from '../types/client'

export const DEFAULT_SUBSCRIPTION: ClientUser['subscription'] = {
    planId: null,
    planCategory: null,
    startDate: null,
    endDate: null,
    status: 'expired',
    classesRemaining: 0,
    maxClassesPerDay: 0,
    weeklyClassLimit: 0,
    advanceBookingDays: 0,
    guestPassesRemaining: 0,
    lastPaymentId: null,
    autoRenew: false,
    razorpaySubscriptionId: null,
}

export const DEFAULT_STATS: ClientUser['stats'] = {
    totalClassesAttended: 0,
    currentStreak: 0,
    longestStreak: 0,
}

export function mapFirebaseError(code: string): string {
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
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed. Please try again.'
        case 'auth/cancelled-popup-request':
            return 'Sign-in was cancelled. Please try again.'
        case 'auth/popup-blocked':
            return 'Popup was blocked by the browser. Please allow popups and try again.'
        case 'auth/unauthorized-domain':
            return 'This domain is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.'
        case 'auth/operation-not-allowed':
            return 'Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.'
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with this email using a different sign-in method.'
        default:
            console.warn('[Auth] Unhandled Firebase error code:', code)
            return 'An unexpected error occurred. Please try again.'
    }
}

export function toSafeDate(val: unknown): Date | null {
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

export function normalizeSubscription(raw: Record<string, unknown> | undefined): ClientUser['subscription'] {
    if (!raw) return { ...DEFAULT_SUBSCRIPTION }
    return {
        planId: (raw.planId as ClientUser['subscription']['planId']) ?? (raw.planType as ClientUser['subscription']['planId']) ?? null,
        planCategory: (raw.planCategory as ClientUser['subscription']['planCategory']) ?? null,
        startDate: toSafeDate(raw.startDate),
        endDate: toSafeDate(raw.endDate),
        status: (raw.status as ClientUser['subscription']['status']) ?? 'expired',
        classesRemaining: raw.classesRemaining !== undefined ? (raw.classesRemaining as number | null) : 0,
        maxClassesPerDay: (raw.maxClassesPerDay as number) ?? 0,
        weeklyClassLimit: (raw.weeklyClassLimit as number) ?? 0,
        advanceBookingDays: (raw.advanceBookingDays as number) ?? 0,
        guestPassesRemaining: (raw.guestPassesRemaining as number) ?? 0,
        lastPaymentId: (raw.lastPaymentId as string) ?? null,
        autoRenew: (raw.autoRenew as boolean) ?? false,
        razorpaySubscriptionId: (raw.razorpaySubscriptionId as string) ?? null,
    }
}

export function buildClientUser(uid: string, data: Record<string, unknown>): ClientUser {
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

export function makeFallbackUser(uid: string, displayName: string | null, email: string | null): ClientUser {
    return {
        id: uid,
        name: displayName || 'Member',
        email: email || '',
        subscription: { ...DEFAULT_SUBSCRIPTION },
        stats: { ...DEFAULT_STATS },
    }
}
