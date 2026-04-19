import { describe, it, expect } from 'vitest';
import { mapFirebaseError, buildAdminUser } from '../../src/stores/adminAuthStore.helpers';

describe('mapFirebaseError (admin)', () => {
    it('maps auth/invalid-email', () => {
        expect(mapFirebaseError('auth/invalid-email')).toBe('Please enter a valid email address.');
    });

    it('maps auth/user-disabled', () => {
        expect(mapFirebaseError('auth/user-disabled')).toBe('This account has been disabled.');
    });

    it('maps auth/user-not-found', () => {
        expect(mapFirebaseError('auth/user-not-found')).toBe('No admin account found with this email.');
    });

    it('maps auth/wrong-password', () => {
        expect(mapFirebaseError('auth/wrong-password')).toBe('Incorrect password. Please try again.');
    });

    it('maps auth/invalid-credential', () => {
        expect(mapFirebaseError('auth/invalid-credential')).toBe('Invalid email or password. Please try again.');
    });

    it('maps auth/too-many-requests', () => {
        expect(mapFirebaseError('auth/too-many-requests')).toBe('Too many failed attempts. Please try again later.');
    });

    it('maps auth/network-request-failed', () => {
        expect(mapFirebaseError('auth/network-request-failed')).toBe('Network error. Check your connection.');
    });

    it('returns generic message for unknown code', () => {
        expect(mapFirebaseError('auth/unknown-error')).toBe('An unexpected error occurred. Please try again.');
        expect(mapFirebaseError('')).toBe('An unexpected error occurred. Please try again.');
        expect(mapFirebaseError('random')).toBe('An unexpected error occurred. Please try again.');
    });
});

describe('buildAdminUser', () => {
    it('builds admin user with all fields', () => {
        const firebaseUser = {
            uid: 'admin-uid-1',
            displayName: 'Admin User',
            email: 'admin@example.com',
        };
        const result = buildAdminUser(firebaseUser);
        expect(result.uid).toBe('admin-uid-1');
        expect(result.role).toBe('super_admin');
        expect(result.name).toBe('Admin User');
        expect(result.email).toBe('admin@example.com');
        expect(result.lastLogin).toBeInstanceOf(Date);
    });

    it('uses fallback name when displayName is null', () => {
        const firebaseUser = {
            uid: 'admin-uid-2',
            displayName: null,
            email: 'admin@example.com',
        };
        const result = buildAdminUser(firebaseUser);
        expect(result.name).toBe('Admin');
    });

    it('uses fallback email when email is null', () => {
        const firebaseUser = {
            uid: 'admin-uid-3',
            displayName: 'Admin',
            email: null,
        };
        const result = buildAdminUser(firebaseUser);
        expect(result.email).toBe('');
    });

    it('sets lastLogin to a recent date', () => {
        const before = new Date();
        const result = buildAdminUser({ uid: 'x', displayName: null, email: null });
        const after = new Date();
        expect(result.lastLogin!.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(result.lastLogin!.getTime()).toBeLessThanOrEqual(after.getTime());
    });
});
