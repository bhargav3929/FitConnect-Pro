import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue } from 'firebase-admin/firestore';

export const activateSubscription = functions.https.onCall(async (data, context) => {
    // Validate authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { planType } = data;
    const userId = context.auth.uid;

    // Validate plan type
    const validPlans = ['weekly', 'monthly', 'quarterly'];
    if (!validPlans.includes(planType)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid plan type');
    }

    try {
        // Get plan details - In a real app, you might fetch this from a collection
        // For now, we mock the plan details based on type
        const durationMap: Record<string, number> = {
            'weekly': 7,
            'monthly': 30,
            'quarterly': 90
        };

        const duration = durationMap[planType];

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        // Update user subscription
        await db.collection('users').doc(userId).update({
            'subscription.planType': planType,
            'subscription.startDate': startDate,
            'subscription.endDate': endDate,
            'subscription.status': 'active',
            'subscription.classesRemaining': duration, // Mock logic: 1 per day for duration
            'updatedAt': FieldValue.serverTimestamp()
        });

        // Future: Send confirmation email

        return { success: true, endDate: endDate.toISOString() };
    } catch (error) {
        console.error("Error activating subscription", error);
        throw new functions.https.HttpsError('internal', 'Failed to activate subscription');
    }
});
