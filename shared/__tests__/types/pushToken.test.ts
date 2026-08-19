import { describe, it, expect } from 'vitest';
import { isExpoPushToken, pushTokenId } from '../../src/types/pushToken';

describe('pushTokenId', () => {
    it('produces a Firestore-safe ID from an Expo token', () => {
        const id = pushTokenId('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]');
        expect(id).toBe('ExponentPushToken_xxxxxxxxxxxxxxxxxxxxxx_');
        expect(id).not.toContain('/');
        expect(id).not.toMatch(/^__.*__$/);
    });

    it('is deterministic, so a device re-registering does not duplicate', () => {
        const token = 'ExponentPushToken[abc-123]';
        expect(pushTokenId(token)).toBe(pushTokenId(token));
    });

    it('keeps distinct tokens distinct', () => {
        expect(pushTokenId('ExponentPushToken[aaa]'))
            .not.toBe(pushTokenId('ExponentPushToken[bbb]'));
    });
});

describe('isExpoPushToken', () => {
    it('accepts both Expo token spellings', () => {
        expect(isExpoPushToken('ExponentPushToken[abc]')).toBe(true);
        expect(isExpoPushToken('ExpoPushToken[abc]')).toBe(true);
    });

    it('rejects raw FCM and APNs tokens', () => {
        expect(isExpoPushToken('fMEq8...:APA91bH')).toBe(false);
        expect(isExpoPushToken('')).toBe(false);
        expect(isExpoPushToken('ExponentPushToken')).toBe(false);
        expect(isExpoPushToken('ExponentPushToken[]')).toBe(false);
    });
});
