import * as functions from 'firebase-functions';
import { auth, db } from '../init';
import { FieldValue } from 'firebase-admin/firestore';

interface SetAdminRoleData {
    targetUid: string;
    isAdmin: boolean;
}

export const setAdminRole = functions.https.onCall(async (data: SetAdminRoleData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // Only existing admins can set admin role (or the first admin via Firebase console)
    if (!context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can set admin roles');
    }

    const { targetUid, isAdmin } = data;

    if (!targetUid || typeof targetUid !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'targetUid is required');
    }
    if (typeof isAdmin !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'isAdmin must be a boolean');
    }

    try {
        // Verify target user exists
        await auth.getUser(targetUid);

        // Set custom claims
        await auth.setCustomUserClaims(targetUid, { admin: isAdmin });

        // Update or create admin doc in Firestore for reference
        const adminRef = db.collection('admins').doc(targetUid);
        if (isAdmin) {
            const userDoc = await db.collection('users').doc(targetUid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            await adminRef.set({
                uid: targetUid,
                email: userData?.email || '',
                name: userData?.name || '',
                role: 'super_admin',
                grantedAt: FieldValue.serverTimestamp(),
                grantedBy: context.auth.uid,
            });
        } else {
            await adminRef.delete();
        }

        return { success: true };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        console.error('Error setting admin role:', error);
        throw new functions.https.HttpsError('internal', 'Failed to set admin role');
    }
});
