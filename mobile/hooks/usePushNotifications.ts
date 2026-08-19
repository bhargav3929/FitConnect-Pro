import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { registerPushToken, removePushToken } from '@fitconnect/shared/firebase/firestore';
import type { PushPlatform } from '@fitconnect/shared/types/pushToken';
import { routeForNotificationLink } from '../lib/notificationRoutes';

/**
 * Android notification channel. Must match ANDROID_CHANNEL_ID in
 * functions/src/triggers/onNotificationCreated.ts - Android silently drops a
 * push addressed to a channel that does not exist.
 */
const ANDROID_CHANNEL_ID = 'default';

/**
 * Foreground presentation. Push and the in-app inbox carry the same content,
 * so a banner while the member is already in the app is still the right call:
 * they may be on a different screen.
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

async function ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Class reminders and updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6A3D',
    });
}

/**
 * Asks for notification permission, prompting only if the member has not
 * already decided. Returns whether notifications may be presented at all,
 * which is true on the simulator too - only remote tokens need real hardware.
 */
async function ensurePermission(): Promise<boolean> {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;

    // Only prompt once; a member who said no is not asked again on every launch.
    if (!existing.canAskAgain) return false;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === 'granted';
}

/**
 * Returns this device's Expo push token, or null when one cannot be minted -
 * permission denied, a simulator (which has no APNs/FCM registration), or a
 * missing EAS project ID. None of those are errors worth surfacing, since the
 * in-app inbox works regardless.
 */
async function resolvePushToken(): Promise<string | null> {
    if (!(await ensurePermission())) return null;

    // Permission is enough to display a notification, but only real hardware
    // can register with APNs/FCM and therefore receive a remote one.
    if (!Device.isDevice) return null;

    const projectId =
        Constants.expoConfig?.extra?.eas?.projectId
        ?? Constants.easConfig?.projectId;
    if (!projectId) {
        console.warn('[push] no EAS project ID, cannot mint a push token');
        return null;
    }

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
}

/**
 * Registers this device for push and routes taps on delivered notifications.
 *
 * Registration re-runs whenever the signed-in member changes, because Expo
 * tokens are per-install, not per-account: two members sharing a phone must
 * not inherit each other's notifications.
 */
export function usePushNotifications(): void {
    const router = useRouter();
    const userId = useClientAuthStore((state) => state.clientUser?.id);
    const registeredFor = useRef<string | null>(null);

    useEffect(() => {
        if (!userId || Platform.OS === 'web') return;
        if (registeredFor.current === userId) return;

        let cancelled = false;

        void (async () => {
            try {
                await ensureAndroidChannel();
                const token = await resolvePushToken();
                if (cancelled || !token) return;

                await registerPushToken(
                    userId,
                    token,
                    Platform.OS as PushPlatform,
                    Device.deviceName,
                );
                registeredFor.current = userId;
            } catch (error) {
                // Push is an enhancement; the inbox is the source of truth.
                console.warn('[push] registration failed', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    // Reset so the next sign-in re-registers this device against that account.
    useEffect(() => {
        if (!userId) registeredFor.current = null;
    }, [userId]);

    // useLastNotificationResponse also reports the tap that cold-started the
    // app, which a plain listener subscribed after launch would miss.
    const response = Notifications.useLastNotificationResponse();
    const handledResponse = useRef<string | null>(null);

    useEffect(() => {
        if (!response) return;

        const identifier = response.notification.request.identifier;
        // The hook replays its last value on every remount; route only once.
        if (handledResponse.current === identifier) return;
        handledResponse.current = identifier;

        const data = response.notification.request.content.data;
        router.push(routeForNotificationLink(data?.link) as never);
    }, [response, router]);
}

/**
 * Drops this device's token so a signed-out phone stops receiving a member's
 * notifications. Best-effort: failing to unregister must not block sign-out.
 */
export async function unregisterPushDevice(userId: string): Promise<void> {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    try {
        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId
            ?? Constants.easConfig?.projectId;
        if (!projectId) return;

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        await removePushToken(userId, token);
    } catch (error) {
        console.warn('[push] unregister failed', error);
    }
}
