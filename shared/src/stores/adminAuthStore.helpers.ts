import { AdminUser } from '../types/admin'

export function mapFirebaseError(code: string): string {
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

export function buildAdminUser(firebaseUser: { uid: string; displayName: string | null; email: string | null }): AdminUser {
    return {
        uid: firebaseUser.uid,
        role: 'super_admin',
        name: firebaseUser.displayName || 'Admin',
        email: firebaseUser.email || '',
        lastLogin: new Date(),
    };
}
