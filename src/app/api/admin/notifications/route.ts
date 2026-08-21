import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// Firestore caps a write batch at 500 operations.
const BATCH_LIMIT = 450;

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 1000;
const MAX_CUSTOM_RECIPIENTS = 500;

type Audience = 'all' | 'active' | 'demo_pending' | 'custom';

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

function parseAudience(value: unknown): Audience {
    if (value === 'active' || value === 'demo_pending' || value === 'custom') return value;
    return 'all';
}

function isDemoPendingMember(data: Record<string, unknown>): boolean {
    const subscription = data.subscription as Record<string, unknown> | undefined;
    return !subscription?.planId;
}

function parseMemberIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return Array.from(new Set(
        value
            .filter((id): id is string => typeof id === 'string')
            .map((id) => id.trim())
            .filter(Boolean),
    ));
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
        const audience = parseAudience(body.audience);
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

        let recipientIds: string[] = [];
        if (audience === 'custom') {
            const requestedMemberIds = parseMemberIds(body.memberIds);
            if (requestedMemberIds.length === 0) {
                return NextResponse.json(
                    { error: 'Select at least one member', code: 'invalid-argument' },
                    { status: 400 },
                );
            }
            if (requestedMemberIds.length > MAX_CUSTOM_RECIPIENTS) {
                return NextResponse.json(
                    { error: `Select ${MAX_CUSTOM_RECIPIENTS} members or fewer`, code: 'invalid-argument' },
                    { status: 400 },
                );
            }
            const recipientSnapshots = await adminDb.getAll(
                ...requestedMemberIds.map((memberId) => adminDb.collection('users').doc(memberId)),
            );
            recipientIds = recipientSnapshots
                .filter((snapshot) => snapshot.exists)
                .map((snapshot) => snapshot.id);
        } else if (audience === 'active') {
            const usersSnapshot = await adminDb.collection('users').where('subscription.status', '==', 'active').get();
            recipientIds = usersSnapshot.docs.map((d) => d.id);
        } else if (audience === 'demo_pending') {
            const usersSnapshot = await adminDb.collection('users').get();
            recipientIds = usersSnapshot.docs
                .filter((d) => isDemoPendingMember(d.data()))
                .map((d) => d.id);
        } else {
            const usersSnapshot = await adminDb.collection('users').get();
            recipientIds = usersSnapshot.docs.map((d) => d.id);
        }

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
