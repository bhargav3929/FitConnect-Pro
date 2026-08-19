/**
 * Expo push tokens for a member's devices.
 *
 * Documents live at `users/{userId}/pushTokens/{tokenId}`. A member may
 * register and remove their own tokens; the Cloud Function that fans out
 * pushes reads them with the Admin SDK and prunes the ones Expo reports as
 * dead.
 */

export type PushPlatform = 'ios' | 'android';

export interface PushToken {
    /** Sanitised document ID derived from the token itself. */
    id: string;
    /** The raw Expo token, e.g. 'ExponentPushToken[xxxxxxxx]'. */
    token: string;
    platform: PushPlatform;
    /** Human-readable device name, to make the token list debuggable. */
    deviceName?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Firestore document IDs may not contain '/' and may not be '.', '..' or
 * match /__.*__/. Expo tokens are wrapped in brackets, so they are folded down
 * to a safe alphanumeric ID. The mapping is deterministic, which keeps
 * re-registering the same token on the same device idempotent.
 */
export function pushTokenId(token: string): string {
    return token.replace(/[^A-Za-z0-9]/g, '_');
}

/** Expo rejects anything that is not one of its own push tokens. */
export function isExpoPushToken(token: string): boolean {
    return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}
