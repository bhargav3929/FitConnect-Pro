import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        // Verify auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const userId = decoded.uid;

        const body = await req.json();
        const { planType } = body;

        // Validate plan type
        const validPlans = ['weekly', 'monthly', 'quarterly'];
        if (!validPlans.includes(planType)) {
            return NextResponse.json(
                { error: 'Invalid plan type', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const durationMap: Record<string, number> = {
            'weekly': 7,
            'monthly': 30,
            'quarterly': 90,
        };

        const duration = durationMap[planType];

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        // Update user subscription
        await adminDb.collection('users').doc(userId).update({
            'subscription.planType': planType,
            'subscription.startDate': startDate,
            'subscription.endDate': endDate,
            'subscription.status': 'active',
            'subscription.classesRemaining': duration,
            'updatedAt': FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, endDate: endDate.toISOString() });
    } catch (error) {
        console.error('Error activating subscription:', error);
        return NextResponse.json(
            { error: 'Failed to activate subscription', code: 'internal' },
            { status: 500 },
        );
    }
}
