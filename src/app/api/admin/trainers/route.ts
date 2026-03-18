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
// POST — createTrainer (admin only)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    try {
        const authResult = await verifyAdmin(req);
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error, code: authResult.code },
                { status: authResult.status },
            );
        }

        const body = await req.json();
        const { name, email, phone, bio, certifications, specialties, profilePictureUrl, experienceYears, rating } = body;

        // Input validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'name is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'A valid email is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (experienceYears !== undefined && (typeof experienceYears !== 'number' || experienceYears < 0)) {
            return NextResponse.json({ error: 'experienceYears must be a non-negative number', code: 'invalid-argument' }, { status: 400 });
        }
        if (rating !== undefined && (typeof rating !== 'number' || rating < 0 || rating > 5)) {
            return NextResponse.json({ error: 'rating must be between 0 and 5', code: 'invalid-argument' }, { status: 400 });
        }

        const trainerRef = adminDb.collection('trainers').doc();
        const now = FieldValue.serverTimestamp();

        const trainerDoc = {
            id: trainerRef.id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone || '',
            bio: bio || '',
            certifications: Array.isArray(certifications) ? certifications : [],
            specialties: Array.isArray(specialties) ? specialties : [],
            profilePictureUrl: profilePictureUrl || '',
            experienceYears: experienceYears || 0,
            rating: rating || undefined,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        };

        await trainerRef.set(trainerDoc);

        return NextResponse.json({ success: true, trainerId: trainerRef.id });
    } catch (error) {
        console.error('Error creating trainer:', error);
        return NextResponse.json(
            { error: 'Failed to create trainer', code: 'internal' },
            { status: 500 },
        );
    }
}

// ---------------------------------------------------------------------------
// PUT — updateTrainer (admin only)
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

        const body = await req.json();
        const { trainerId, ...updates } = body;

        if (!trainerId || typeof trainerId !== 'string') {
            return NextResponse.json({ error: 'trainerId is required', code: 'invalid-argument' }, { status: 400 });
        }

        // Validate specific fields if provided
        if (updates.email !== undefined && (typeof updates.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email))) {
            return NextResponse.json({ error: 'A valid email is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (updates.experienceYears !== undefined && (typeof updates.experienceYears !== 'number' || updates.experienceYears < 0)) {
            return NextResponse.json({ error: 'experienceYears must be a non-negative number', code: 'invalid-argument' }, { status: 400 });
        }
        if (updates.rating !== undefined && (typeof updates.rating !== 'number' || updates.rating < 0 || updates.rating > 5)) {
            return NextResponse.json({ error: 'rating must be between 0 and 5', code: 'invalid-argument' }, { status: 400 });
        }

        const trainerRef = adminDb.collection('trainers').doc(trainerId);
        const trainerDoc = await trainerRef.get();
        if (!trainerDoc.exists) {
            return NextResponse.json({ error: 'Trainer not found', code: 'not-found' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (updates.name !== undefined) updateData.name = updates.name.trim();
        if (updates.email !== undefined) updateData.email = updates.email.trim().toLowerCase();
        if (updates.phone !== undefined) updateData.phone = updates.phone;
        if (updates.bio !== undefined) updateData.bio = updates.bio;
        if (updates.certifications !== undefined) updateData.certifications = updates.certifications;
        if (updates.specialties !== undefined) updateData.specialties = updates.specialties;
        if (updates.profilePictureUrl !== undefined) updateData.profilePictureUrl = updates.profilePictureUrl;
        if (updates.experienceYears !== undefined) updateData.experienceYears = updates.experienceYears;
        if (updates.rating !== undefined) updateData.rating = updates.rating;
        if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

        await trainerRef.update(updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating trainer:', error);
        return NextResponse.json(
            { error: 'Failed to update trainer', code: 'internal' },
            { status: 500 },
        );
    }
}

// ---------------------------------------------------------------------------
// DELETE — soft-delete trainer (admin only)
// Sets isActive to false. Active classes with this trainer remain untouched.
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
    try {
        const authResult = await verifyAdmin(req);
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error, code: authResult.code },
                { status: authResult.status },
            );
        }

        const body = await req.json();
        const { trainerId } = body;

        if (!trainerId || typeof trainerId !== 'string') {
            return NextResponse.json({ error: 'trainerId is required', code: 'invalid-argument' }, { status: 400 });
        }

        const trainerRef = adminDb.collection('trainers').doc(trainerId);
        const trainerDoc = await trainerRef.get();
        if (!trainerDoc.exists) {
            return NextResponse.json({ error: 'Trainer not found', code: 'not-found' }, { status: 404 });
        }

        // Soft delete — mark as inactive
        await trainerRef.update({
            isActive: false,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting trainer:', error);
        return NextResponse.json(
            { error: 'Failed to delete trainer', code: 'internal' },
            { status: 500 },
        );
    }
}
