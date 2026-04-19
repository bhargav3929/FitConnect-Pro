import { describe, it, expect, beforeEach } from 'vitest';
import { initApiConfig, getApiBaseUrl } from '../../src/firebase/api-config';

describe('api-config', () => {
    beforeEach(() => {
        // Reset to default
        initApiConfig({ baseUrl: '' });
    });

    it('defaults to empty string (relative URLs for web)', () => {
        expect(getApiBaseUrl()).toBe('');
    });

    it('sets and returns custom base URL for mobile', () => {
        initApiConfig({ baseUrl: 'https://fitconnect.vercel.app' });
        expect(getApiBaseUrl()).toBe('https://fitconnect.vercel.app');
    });

    it('allows resetting base URL back to empty', () => {
        initApiConfig({ baseUrl: 'https://example.com' });
        expect(getApiBaseUrl()).toBe('https://example.com');

        initApiConfig({ baseUrl: '' });
        expect(getApiBaseUrl()).toBe('');
    });

    it('produces correct full URL when prepended to API path', () => {
        // Web (relative)
        initApiConfig({ baseUrl: '' });
        expect(`${getApiBaseUrl()}/api/bookings/book`).toBe('/api/bookings/book');

        // Mobile (absolute)
        initApiConfig({ baseUrl: 'https://fitconnect.vercel.app' });
        expect(`${getApiBaseUrl()}/api/bookings/book`).toBe(
            'https://fitconnect.vercel.app/api/bookings/book',
        );
    });
});
