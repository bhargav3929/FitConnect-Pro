'use client';

import { useCallback, useRef } from 'react';

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
    modal?: { ondismiss?: () => void };
    handler: (response: RazorpayResponse) => void;
}

export interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayInstance {
    open(): void;
    close(): void;
}

function loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') return resolve(false);
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export function useRazorpay() {
    const instanceRef = useRef<RazorpayInstance | null>(null);

    const openCheckout = useCallback(async (options: RazorpayOptions): Promise<void> => {
        const loaded = await loadScript();
        if (!loaded) throw new Error('Razorpay SDK failed to load. Check your internet connection.');
        instanceRef.current = new window.Razorpay(options);
        instanceRef.current.open();
    }, []);

    const closeCheckout = useCallback(() => {
        instanceRef.current?.close();
    }, []);

    return { openCheckout, closeCheckout };
}
