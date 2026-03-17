import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        // Verify auth + admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        if (!decoded.admin) {
            return NextResponse.json(
                { error: 'Only admins can set admin roles', code: 'permission-denied' },
                { status: 403 },
            );
        }

        const body = await req.json();
        const { targetUid, isAdmin } = body;

        if (!targetUid || typeof targetUid !== 'string') {
            return NextResponse.json({ error: 'targetUid is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (typeof isAdmin !== 'boolean') {
            return NextResponse.json({ error: 'isAdmin must be a boolean', code: 'invalid-argument' }, { status: 400 });
        }

        // Verify target user exists
        await adminAuth.getUser(targetUid);

        // Set custom claims
        await adminAuth.setCustomUserClaims(targetUid, { admin: isAdmin });

        // Update or create admin doc in Firestore for reference
        const adminRef = adminDb.collection('admins').doc(targetUid);
        if (isAdmin) {
            const userDoc = await adminDb.collection('users').doc(targetUid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            await adminRef.set({
                uid: targetUid,
                email: userData?.email || '',
                name: userData?.name || '',
                role: 'super_admin',
                grantedAt: FieldValue.serverTimestamp(),
                grantedBy: decoded.uid,
            });
        } else {
            await adminRef.delete();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error setting admin role:', error);
        return NextResponse.json(
            { error: 'Failed to set admin role', code: 'internal' },
            { status: 500 },
        );
    }
}
