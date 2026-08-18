import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { normalizePhone, PHONE_VALIDATION_MESSAGE } from '@fitconnect/shared/utils/phone';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// POST — create a member (admin only)
//
// Creates the Firebase Auth account and the matching users/{uid} document with
// an empty subscription, mirroring the shape the self-serve signup flow writes.
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

        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body', code: 'invalid-argument' }, { status: 400 });
        }

        const { name, email, phone, age, password } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'name is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
            return NextResponse.json({ error: 'A valid email is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (password !== undefined && (typeof password !== 'string' || password.length < 6)) {
            return NextResponse.json({ error: 'password must be at least 6 characters', code: 'invalid-argument' }, { status: 400 });
        }
        if (age !== undefined && age !== null && (typeof age !== 'number' || age < 0 || age > 120)) {
            return NextResponse.json({ error: 'age must be between 0 and 120', code: 'invalid-argument' }, { status: 400 });
        }

        // Firebase Auth only accepts E.164, so an unnormalized number would throw
        // from createUser. Reject it here with a message the admin can act on.
        const suppliedPhone = typeof phone === 'string' ? phone.trim() : '';
        const normalizedPhone = suppliedPhone ? normalizePhone(suppliedPhone) : null;
        if (suppliedPhone && !normalizedPhone) {
            return NextResponse.json({ error: PHONE_VALIDATION_MESSAGE, code: 'invalid-argument' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        // Reject duplicates up front so the admin gets a clear message rather
        // than a raw Firebase error.
        try {
            await adminAuth.getUserByEmail(normalizedEmail);
            return NextResponse.json(
                { error: 'A member with this email already exists', code: 'already-exists' },
                { status: 409 },
            );
        } catch (err: unknown) {
            const code = (err as { code?: string })?.code;
            if (code !== 'auth/user-not-found') throw err;
        }

        // Without a password the account is created in a passwordless state; the
        // member sets one via the standard password-reset link.
        const authUser = await adminAuth.createUser({
            email: normalizedEmail,
            displayName: trimmedName,
            ...(typeof password === 'string' ? { password } : {}),
            ...(normalizedPhone ? { phoneNumber: normalizedPhone } : {}),
        });

        const now = FieldValue.serverTimestamp();

        await adminDb.collection('users').doc(authUser.uid).set({
            uid: authUser.uid,
            email: normalizedEmail,
            name: trimmedName,
            displayName: trimmedName,
            ...(normalizedPhone ? { phone: normalizedPhone } : {}),
            age: typeof age === 'number' ? age : 0,
            fitnessGoals: [],
            isFoundingMember: false,
            createdBy: authResult.uid,
            createdAt: now,
            updatedAt: now,
            subscription: {
                planId: null,
                planCategory: null,
                startDate: null,
                endDate: null,
                status: 'expired',
                classesRemaining: 0,
                introCreditRemaining: 0,
                maxClassesPerDay: 0,
                weeklyClassLimit: 0,
                advanceBookingDays: 0,
                guestPassesRemaining: 0,
            },
            stats: {
                totalClassesAttended: 0,
                currentStreak: 0,
                longestStreak: 0,
            },
        });

        return NextResponse.json({ success: true, uid: authUser.uid });
    } catch (error) {
        console.error('Error creating member:', error);
        return NextResponse.json({ error: 'Failed to create member', code: 'internal' }, { status: 500 });
    }
}

// ---------------------------------------------------------------------------
// DELETE — remove a member and everything attached to them (admin only)
//
// Releases the member's spots on any upcoming class before deleting their
// bookings, otherwise those seats stay occupied by a member who no longer
// exists and can never be rebooked.
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

        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body', code: 'invalid-argument' }, { status: 400 });
        }

        const { userId } = body;
        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ error: 'userId is required', code: 'invalid-argument' }, { status: 400 });
        }

        if (userId === authResult.uid) {
            return NextResponse.json(
                { error: 'You cannot delete your own account', code: 'failed-precondition' },
                { status: 400 },
            );
        }

        // Never let an admin be removed through the members screen.
        let authUserExists = true;
        try {
            const target = await adminAuth.getUser(userId);
            if (target.customClaims?.admin) {
                return NextResponse.json(
                    { error: 'Cannot delete an admin account from the members list', code: 'failed-precondition' },
                    { status: 400 },
                );
            }
        } catch (err: unknown) {
            const code = (err as { code?: string })?.code;
            if (code !== 'auth/user-not-found') throw err;
            // Orphaned Firestore doc with no auth record — still worth cleaning up.
            authUserExists = false;
        }

        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists && !authUserExists) {
            return NextResponse.json({ error: 'Member not found', code: 'not-found' }, { status: 404 });
        }

        const bookingsSnap = await adminDb.collection('bookings').where('userId', '==', userId).get();

        // Group the spots to release per class, counting only confirmed bookings
        // on classes that have not happened yet.
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const spotsToRelease = new Map<string, number[]>();
        for (const doc of bookingsSnap.docs) {
            const data = doc.data();
            if (data.status !== 'confirmed') continue;

            const raw = data.classDate;
            const classDate = raw instanceof Timestamp ? raw.toDate() : raw ? new Date(raw) : null;
            if (!classDate || Number.isNaN(classDate.getTime()) || classDate < startOfToday) continue;

            const classId = data.classId;
            if (typeof classId !== 'string' || !classId) continue;
            if (typeof data.spotNumber !== 'number') continue;

            const existing = spotsToRelease.get(classId) ?? [];
            existing.push(data.spotNumber);
            spotsToRelease.set(classId, existing);
        }

        const batch = adminDb.batch();
        const now = FieldValue.serverTimestamp();

        for (const [classId, spots] of spotsToRelease) {
            batch.update(adminDb.collection('classes').doc(classId), {
                bookedCount: FieldValue.increment(-spots.length),
                bookedSpots: FieldValue.arrayRemove(...spots),
                updatedAt: now,
            });
        }

        for (const doc of bookingsSnap.docs) {
            batch.delete(doc.ref);
        }

        if (userDoc.exists) {
            batch.delete(userRef);
        }

        await batch.commit();

        if (authUserExists) {
            await adminAuth.deleteUser(userId);
        }

        return NextResponse.json({
            success: true,
            deletedBookings: bookingsSnap.size,
            releasedClasses: spotsToRelease.size,
        });
    } catch (error) {
        console.error('Error deleting member:', error);
        return NextResponse.json({ error: 'Failed to delete member', code: 'internal' }, { status: 500 });
    }
}
