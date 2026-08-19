import { describe, it, expect } from 'vitest';
import { routeForNotificationLink } from '../../lib/notificationRoutes';

describe('routeForNotificationLink', () => {
    it('translates backend web routes to mobile routes', () => {
        expect(routeForNotificationLink('/user/bookings')).toBe('/(tabs)/bookings');
        expect(routeForNotificationLink('/user/schedule')).toBe('/(tabs)/schedule');
        expect(routeForNotificationLink('/user/subscribe')).toBe('/subscribe');
        expect(routeForNotificationLink('/user/profile')).toBe('/(tabs)/profile');
    });

    it('falls back to the inbox for unknown or missing links', () => {
        expect(routeForNotificationLink('/user/nope')).toBe('/notifications');
        expect(routeForNotificationLink(undefined)).toBe('/notifications');
        expect(routeForNotificationLink(null)).toBe('/notifications');
    });
});
