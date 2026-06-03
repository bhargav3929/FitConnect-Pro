import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue } from 'firebase-admin/firestore';

const FOUNDING_MEMBER_LIMIT = 25;

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        // Determine founding member eligibility using an atomic counter.
        // The counter doc `counters/founding_members` tracks how many
        // founding slots have been assigned so far.
        let isFoundingMember = false;

        const counterRef = db.collection('counters').doc('founding_members');

        try {
            await db.runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);

                let currentCount = 0;
                if (counterDoc.exists) {
                    currentCount = counterDoc.data()?.count ?? 0;
                }

                if (currentCount < FOUNDING_MEMBER_LIMIT) {
                    // Check if this user is NOT an admin
                    const adminDoc = await transaction.get(
                        db.collection('admins').doc(user.uid),
                    );

                    if (!adminDoc.exists) {
                        isFoundingMember = true;
                        // Increment the counter
                        if (counterDoc.exists) {
                            transaction.update(counterRef, {
                                count: FieldValue.increment(1),
                                lastUpdated: FieldValue.serverTimestamp(),
                            });
                        } else {
                            transaction.set(counterRef, {
                                count: 1,
                                lastUpdated: FieldValue.serverTimestamp(),
                            });
                        }
                    }
                }
            });
        } catch (txError) {
            console.error('Founding member transaction failed, defaulting to false:', txError);
            isFoundingMember = false;
        }

        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            name: user.displayName || '',
            age: 0, // Will be updated in profile
            fitnessGoals: [],
            profilePictureUrl: user.photoURL || null,
            isFoundingMember,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            subscription: {
                planType: null,
                startDate: null,
                endDate: null,
                status: 'expired',
                classesRemaining: 0,
                maxClassesPerDay: 0,
                weeklyClassLimit: 0,
                advanceBookingDays: 0,
                guestPassesRemaining: 0
            },
            stats: {
                totalClassesAttended: 0,
                currentStreak: 0,
                longestStreak: 0
            }
        });

        console.log(
            `User document created for ${user.uid}` +
            (isFoundingMember ? ' ✨ FOUNDING MEMBER' : ''),
        );

        // Future: Send welcome email
    } catch (error) {
        console.error('Error creating user document:', error);
    }
});
