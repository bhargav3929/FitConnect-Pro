import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// Firestore caps a write batch at 500 operations.
const BATCH_LIMIT = 450;

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 1000;

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
// POST — broadcast an announcement to members (admin only)
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

        const title = typeof body.title === 'string' ? body.title.trim() : '';
        const message = typeof body.body === 'string' ? body.body.trim() : '';
        const audience = body.audience === 'active' ? 'active' : 'all';
        const link = typeof body.link === 'string' && body.link.trim() ? body.link.trim() : undefined;

        if (!title) {
            return NextResponse.json({ error: 'title is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (title.length > MAX_TITLE_LENGTH) {
            return NextResponse.json(
                { error: `title must be ${MAX_TITLE_LENGTH} characters or fewer`, code: 'invalid-argument' },
                { status: 400 },
            );
        }
        if (!message) {
            return NextResponse.json({ error: 'body is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (message.length > MAX_BODY_LENGTH) {
            return NextResponse.json(
                { error: `body must be ${MAX_BODY_LENGTH} characters or fewer`, code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const usersSnapshot = audience === 'active'
            ? await adminDb.collection('users').where('subscription.status', '==', 'active').get()
            : await adminDb.collection('users').get();

        const recipientIds = usersSnapshot.docs.map((d) => d.id);
        if (recipientIds.length === 0) {
            return NextResponse.json({ success: true, recipients: 0 });
        }

        const now = FieldValue.serverTimestamp();

        for (let i = 0; i < recipientIds.length; i += BATCH_LIMIT) {
            const batch = adminDb.batch();
            for (const userId of recipientIds.slice(i, i + BATCH_LIMIT)) {
                const ref = adminDb.collection('notifications').doc();
                batch.set(ref, {
                    id: ref.id,
                    userId,
                    type: 'announcement',
                    title,
                    body: message,
                    read: false,
                    readAt: null,
                    ...(link ? { link } : {}),
                    sentBy: authResult.uid,
                    createdAt: now,
                });
            }
            await batch.commit();
        }

        return NextResponse.json({ success: true, recipients: recipientIds.length });
    } catch (error) {
        console.error('Error sending announcement:', error);
        return NextResponse.json({ error: 'Failed to send announcement', code: 'internal' }, { status: 500 });
    }
}
