/**
 * Notifications are written once, by the backend, with web routes in their
 * `link` field. The mobile app translates those to its own routes here so the
 * inbox and a tapped push notification land in the same place.
 */
const LINK_ROUTES: Record<string, string> = {
    '/user/bookings': '/(tabs)/bookings',
    '/user/schedule': '/(tabs)/schedule',
    '/user/subscribe': '/subscribe',
    '/user/profile': '/(tabs)/profile',
};

/** The mobile route for a notification link, or the inbox as a safe fallback. */
export function routeForNotificationLink(link: unknown): string {
    if (typeof link === 'string' && LINK_ROUTES[link]) return LINK_ROUTES[link];
    return '/notifications';
}

export { LINK_ROUTES };
