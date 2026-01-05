import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue } from 'firebase-admin/firestore';

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            name: user.displayName || '',
            age: 0, // Will be updated in profile
            fitnessGoals: [],
            profilePictureUrl: user.photoURL || null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            subscription: {
                planType: null,
                startDate: null,
                endDate: null,
                status: 'expired',
                classesRemaining: 0
            },
            stats: {
                totalClassesAttended: 0,
                currentStreak: 0,
                longestStreak: 0
            }
        });

        console.log(`User document created for ${user.uid}`);

        // Future: Send welcome email
    } catch (error) {
        console.error('Error creating user document:', error);
    }
});
