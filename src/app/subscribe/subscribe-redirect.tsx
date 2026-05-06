'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';

export function SubscribeRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading, initAuth } = useClientAuthStore();

    useEffect(() => {
        const unsubscribe = initAuth();
        return () => unsubscribe();
    }, [initAuth]);

    useEffect(() => {
        if (isLoading) return;
        const qs = searchParams.toString();
        const suffix = qs ? `?${qs}` : '';
        if (isAuthenticated) {
            router.replace(`/user/subscribe${suffix}`);
        } else {
            const returnTo = encodeURIComponent(`/user/subscribe${suffix}`);
            router.replace(`/user/login?returnTo=${returnTo}`);
        }
    }, [isAuthenticated, isLoading, router, searchParams]);

    return (
        <div className="min-h-screen bg-peach-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-peach-400/30 border-t-terra-400 rounded-full animate-spin" />
                <p className="text-olive-300 text-sm tracking-wider">REDIRECTING...</p>
            </div>
        </div>
    );
}
