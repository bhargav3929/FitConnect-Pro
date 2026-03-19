import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Helper: verify admin token
// ---------------------------------------------------------------------------

async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Must be logged in', code: 'unauthenticated', status: 401 };
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.admin) {
        return { error: 'Admin access required', code: 'permission-denied', status: 403 };
    }
    return { uid: decoded.uid };
}

// ---------------------------------------------------------------------------
// GET — getFacility (authenticated, returns the single gym center)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
    try {
        // Verify auth (any authenticated user can read facility info)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        await adminAuth.verifyIdToken(token);

        const snapshot = await adminDb.collection('gymCenters').limit(1).get();

        if (snapshot.empty) {
            return NextResponse.json({ success: true, facility: null });
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        return NextResponse.json({
            success: true,
            facility: { ...data, id: doc.id },
        });
    } catch (error) {
        console.error('Error fetching facility:', error);
        return NextResponse.json(
            { error: 'Failed to fetch facility', code: 'internal' },
            { status: 500 },
        );
    }
}

// ---------------------------------------------------------------------------
// PUT — updateFacility (admin only)
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
    try {
        const authResult = await verifyAdmin(req);
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error, code: authResult.code },
                { status: authResult.status },
            );
        }

        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid request body', code: 'invalid-argument' },
                { status: 400 },
            );
        }
        const { facilityId, ...updates } = body;

        if (!facilityId || typeof facilityId !== 'string') {
            return NextResponse.json({ error: 'facilityId is required', code: 'invalid-argument' }, { status: 400 });
        }

        const facilityRef = adminDb.collection('gymCenters').doc(facilityId);
        const facilityDoc = await facilityRef.get();
        if (!facilityDoc.exists) {
            return NextResponse.json({ error: 'Facility not found', code: 'not-found' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.address !== undefined) updateData.address = updates.address;
        if (updates.coordinates !== undefined) updateData.coordinates = updates.coordinates;
        if (updates.contactInfo !== undefined) updateData.contactInfo = updates.contactInfo;
        if (updates.operatingHours !== undefined) updateData.operatingHours = updates.operatingHours;
        if (updates.facilities !== undefined) updateData.facilities = updates.facilities;
        if (updates.photos !== undefined) updateData.photos = updates.photos;
        if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

        await facilityRef.update(updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating facility:', error);
        return NextResponse.json(
            { error: 'Failed to update facility', code: 'internal' },
            { status: 500 },
        );
    }
}
