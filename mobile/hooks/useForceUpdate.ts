import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';

const APP_STORE_LOOKUP_URL = 'https://itunes.apple.com/lookup';
const IOS_BUNDLE_ID = 'com.fitconnect.pro';
const APP_STORE_COUNTRY = 'IN';
const LOOKUP_TIMEOUT_MS = 5000;

type ForceUpdateState = {
    isUpdateRequired: boolean;
    isChecking: boolean;
    latestVersion: string | null;
    currentVersion: string | null;
    storeUrl: string | null;
};

type AppStoreLookupResult = {
    version?: string;
    trackViewUrl?: string;
    trackId?: number;
};

type AppStoreLookupResponse = {
    resultCount?: number;
    results?: AppStoreLookupResult[];
};

function isStoreVersionNewer(currentVersion: string, storeVersion: string): boolean {
    return storeVersion.localeCompare(currentVersion, undefined, {
        numeric: true,
        sensitivity: 'base',
    }) > 0;
}

async function fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

function getStoreUrl(result: AppStoreLookupResult): string | null {
    if (result.trackViewUrl) return result.trackViewUrl;
    if (result.trackId) return `itms-apps://itunes.apple.com/app/id${result.trackId}`;
    return null;
}

export function useForceUpdate(): ForceUpdateState & { openAppStore: () => Promise<void> } {
    const [state, setState] = useState<ForceUpdateState>({
        isUpdateRequired: false,
        isChecking: Platform.OS === 'ios' && !__DEV__,
        latestVersion: null,
        currentVersion: Application.nativeApplicationVersion ?? null,
        storeUrl: null,
    });

    useEffect(() => {
        if (Platform.OS !== 'ios' || __DEV__) {
            return;
        }

        let cancelled = false;

        async function checkAppStoreVersion() {
            try {
                const lookupUrl = `${APP_STORE_LOOKUP_URL}?bundleId=${encodeURIComponent(IOS_BUNDLE_ID)}&country=${APP_STORE_COUNTRY}`;
                const response = await fetchWithTimeout(lookupUrl);
                const data = (await response.json()) as AppStoreLookupResponse;
                const result = data.results?.[0];
                const latestVersion = result?.version ?? null;
                const currentVersion = Application.nativeApplicationVersion ?? null;

                if (!latestVersion || !currentVersion) {
                    if (!cancelled) setState((prev) => ({ ...prev, isChecking: false }));
                    return;
                }

                if (!cancelled) {
                    setState({
                        isUpdateRequired: isStoreVersionNewer(currentVersion, latestVersion),
                        isChecking: false,
                        latestVersion,
                        currentVersion,
                        storeUrl: result ? getStoreUrl(result) : null,
                    });
                }
            } catch (error) {
                console.log('App Store version check failed. Continuing without blocking update.', error);
                if (!cancelled) setState((prev) => ({ ...prev, isChecking: false }));
            }
        }

        void checkAppStoreVersion();

        return () => {
            cancelled = true;
        };
    }, []);

    const openAppStore = useCallback(async () => {
        if (!state.storeUrl) return;
        await Linking.openURL(state.storeUrl);
    }, [state.storeUrl]);

    return {
        ...state,
        openAppStore,
    };
}
