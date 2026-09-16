import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue } from 'firebase-admin/firestore';
import { recordSubscriptionEvent } from '../lib/subscriptionEvents';

const FOUNDING_MEMBER_LIMIT = 25;

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        let isFoundingMember = false;
        let foundingWaitlistId: string | null = null;

        const counterRef = db.collection('counters').doc('founding_members');
        const userRef = db.collection('users').doc(user.uid);
        const adminRef = db.collection('admins').doc(user.uid);
        const normalizedEmail = (user.email || '').trim().toLowerCase();

        try {
            await db.runTransaction(async (transaction) => {
                if (!normalizedEmail) return;

                // Admin accounts should never consume a founding-member slot.
                const adminDoc = await transaction.get(adminRef);
                if (adminDoc.exists) return;

                const waitlistByEmailLower = await transaction.get(
                    db.collection('waitlist')
                        .where('emailLower', '==', normalizedEmail)
                        .limit(10),
                );
                const waitlistSnap = waitlistByEmailLower.empty
                    ? await transaction.get(
                        db.collection('waitlist')
                            .where('email', '==', normalizedEmail)
                            .limit(10),
                    )
                    : waitlistByEmailLower;

                const waitlistDoc = waitlistSnap.docs.find((doc) => {
                    const data = doc.data();
                    return data.status !== 'archived' && !data.claimedBy;
                });

                if (!waitlistDoc) return;

                const counterDoc = await transaction.get(counterRef);

                let currentCount = 0;
                if (counterDoc.exists) {
                    currentCount = counterDoc.data()?.count ?? 0;
                }

                if (currentCount < FOUNDING_MEMBER_LIMIT) {
                    isFoundingMember = true;
                    foundingWaitlistId = waitlistDoc.id;

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

                    transaction.update(waitlistDoc.ref, {
                        status: 'converted',
                        claimedBy: user.uid,
                        claimedAt: FieldValue.serverTimestamp(),
                        foundingMember: true,
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                }
            });
        } catch (txError) {
            console.error('Founding member transaction failed, defaulting to false:', txError);
            isFoundingMember = false;
            foundingWaitlistId = null;
        }

        const defaultSubscription = {
            planId: null,
            planType: null,
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
            lastPaymentId: null,
            autoRenew: false,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            razorpaySubscriptionId: null,
            razorpayPlanId: null,
            pendingPlanId: null,
            pendingRazorpayPlanId: null,
            pendingPlanEffectiveAt: null,
            pendingPricingVariant: null,
            pricingVariant: null,
            lastSyncedAt: null,
            kickstarterCreditsCarriedForward: false,
            carriedForwardCredits: 0,
        };

        const profileData: Record<string, unknown> = {
            uid: user.uid,
            email: user.email,
            age: 0, // Will be updated in profile
            fitnessGoals: [],
            profilePictureUrl: user.photoURL || null,
            isFoundingMember,
            foundingWaitlistId,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            stats: {
                totalClassesAttended: 0,
                currentStreak: 0,
                longestStreak: 0
            }
        };

        if (user.displayName) {
            profileData.name = user.displayName;
        }

        // Auth events can be delayed. Never let a late onCreate event replace a
        // subscription already granted by a successful payment transaction.
        await db.runTransaction(async (transaction) => {
            const existingUser = await transaction.get(userRef);

            if (!existingUser.exists) {
                transaction.set(userRef, {
                    ...profileData,
                    subscription: defaultSubscription,
                });
                recordSubscriptionEvent(transaction, {
                    userId: user.uid,
                    action: 'profile-created',
                    source: 'auth-trigger',
                    reason: 'New account: profile created with an empty subscription',
                    before: null,
                    changes: { ...defaultSubscription },
                    metadata: { isFoundingMember, provider: user.providerData?.[0]?.providerId ?? null },
                });
                return;
            }

            const existingData = existingUser.data() ?? {};
            const patch: Record<string, unknown> = {
                isFoundingMember,
                foundingWaitlistId,
                updatedAt: FieldValue.serverTimestamp(),
            };

            if (!existingData.uid) patch.uid = user.uid;
            if (!existingData.email && user.email) patch.email = user.email;
            if (!existingData.name && user.displayName) patch.name = user.displayName;
            if (!existingData.subscription) patch.subscription = defaultSubscription;
            if (!existingData.stats) patch.stats = profileData.stats;

            transaction.set(userRef, patch, { merge: true });
            recordSubscriptionEvent(transaction, {
                userId: user.uid,
                action: 'profile-repaired',
                source: 'auth-trigger',
                reason: patch.subscription
                    ? 'Late auth event: profile existed without a subscription, default added'
                    : 'Late auth event: profile already existed, subscription left untouched',
                before: (existingData.subscription as Record<string, unknown> | undefined) ?? null,
                changes: patch.subscription ? { ...defaultSubscription } : {},
                metadata: { patchedFields: Object.keys(patch) },
            });
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
