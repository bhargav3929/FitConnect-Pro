import { useEffect, useMemo, useState } from 'react';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { subscribeToUserNotifications } from '@fitconnect/shared/firebase/firestore';
import type { AppNotification } from '@fitconnect/shared/types/notification';

/**
 * Live view of the signed-in member's in-app notifications.
 *
 * Backed by a Firestore snapshot listener, so the unread badge and the inbox
 * screen stay in step without either polling.
 */
export function useNotifications() {
    const clientUser = useClientAuthStore((state) => state.clientUser);
    const userId = clientUser?.id;

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        return subscribeToUserNotifications(
            userId,
            (items) => {
                setNotifications(items);
                setIsLoading(false);
            },
            () => {
                // Leave the inbox empty rather than crashing the tab.
                setNotifications([]);
                setIsLoading(false);
            },
        );
    }, [userId]);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications],
    );

    return { notifications, unreadCount, isLoading };
}
