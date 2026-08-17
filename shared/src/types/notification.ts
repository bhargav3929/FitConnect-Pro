/**
 * In-app notifications.
 *
 * Documents live in the top-level `notifications` collection and are written
 * exclusively by the Admin SDK (scheduled Cloud Functions and admin API routes).
 * Clients may read their own and mark them read; they may never create one.
 */

export type NotificationType =
    | 'class_reminder'
    | 'plan_expiry'
    | 'announcement';

export interface AppNotification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    read: boolean;
    readAt?: Date | null;
    /** In-app route to open when the notification is tapped, e.g. '/user/bookings'. */
    link?: string;
    createdAt: Date;
    /** Admin uid, for announcements sent from the dashboard. */
    sentBy?: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
    class_reminder: 'Class Reminder',
    plan_expiry: 'Plan Expiry',
    announcement: 'Announcement',
};

/**
 * Deterministic document IDs make the scheduled reminder jobs idempotent - a
 * re-run on the same day overwrites the same document instead of sending a
 * duplicate. Firestore IDs cannot contain '/'.
 */
export function classReminderId(bookingId: string): string {
    return `class_reminder__${bookingId}`;
}

export function planExpiryId(userId: string, daysLeft: number): string {
    return `plan_expiry__${userId}__${daysLeft}`;
}

/** Days before expiry at which a member is reminded. */
export const PLAN_EXPIRY_REMINDER_DAYS = [7, 3, 1];
