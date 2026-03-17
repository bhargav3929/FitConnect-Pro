import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue } from 'firebase-admin/firestore';

export const onBookingStatusChange = functions.firestore
    .document('bookings/{bookingId}')
    .onUpdate(async (change, _context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Only process if status actually changed
        if (before.status === after.status) {
            return null;
        }

        const userId = after.userId;

        // Handle status change to 'attended'
        if (after.status === 'attended' && before.status !== 'attended') {
            try {
                const userRef = db.collection('users').doc(userId);
                const userDoc = await userRef.get();

                if (!userDoc.exists) {
                    console.error(`User ${userId} not found for booking status update`);
                    return null;
                }

                const userData = userDoc.data()!;
                const stats = userData.stats || {};
                const lastAttended = stats.lastAttendedDate
                    ? (stats.lastAttendedDate.toDate ? stats.lastAttendedDate.toDate() : new Date(stats.lastAttendedDate))
                    : null;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let streakUpdate: Record<string, unknown> = {};

                if (lastAttended) {
                    const lastDate = new Date(lastAttended);
                    lastDate.setHours(0, 0, 0, 0);

                    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysDiff === 1) {
                        // Consecutive day — extend streak
                        const newStreak = (stats.currentStreak || 0) + 1;
                        const longestStreak = Math.max(newStreak, stats.longestStreak || 0);
                        streakUpdate = {
                            'stats.currentStreak': newStreak,
                            'stats.longestStreak': longestStreak,
                        };
                    } else if (daysDiff > 1) {
                        // Streak broken, reset to 1
                        streakUpdate = {
                            'stats.currentStreak': 1,
                            'stats.longestStreak': Math.max(1, stats.longestStreak || 0),
                        };
                    }
                    // daysDiff === 0: same day, don't change streak
                } else {
                    // First ever attendance
                    streakUpdate = {
                        'stats.currentStreak': 1,
                        'stats.longestStreak': Math.max(1, stats.longestStreak || 0),
                    };
                }

                await userRef.update({
                    'stats.totalClassesAttended': FieldValue.increment(1),
                    'stats.lastAttendedDate': FieldValue.serverTimestamp(),
                    ...streakUpdate,
                    updatedAt: FieldValue.serverTimestamp(),
                });
            } catch (error) {
                console.error('Error updating user stats on attendance:', error);
            }
        }

        return null;
    });
