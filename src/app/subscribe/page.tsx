'use client';

import { Suspense } from 'react';
import { SubscribeRedirect } from './subscribe-redirect';

export default function SubscribeRedirectPage() {
    return (
        <Suspense fallback={<SubscribeRedirectFallback />}>
            <SubscribeRedirect />
        </Suspense>
    );
}

function SubscribeRedirectFallback() {
    return (
        <div className="min-h-screen bg-peach-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-peach-400/30 border-t-terra-400 rounded-full animate-spin" />
                <p className="text-olive-300 text-sm tracking-wider">REDIRECTING...</p>
            </div>
        </div>
    );
}
