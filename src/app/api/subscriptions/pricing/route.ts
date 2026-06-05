import { NextResponse } from 'next/server';
import { getSyncedPricing } from '@/lib/razorpay/pricing';

// ISR: cache pricing for 5 minutes
export const revalidate = 300;

export async function GET() {
    try {
        return NextResponse.json(await getSyncedPricing());
    } catch (error) {
        console.error('[pricing] Failed to return pricing:', error);
        return NextResponse.json({ plans: [], lastSyncedAt: null, source: 'static' }, { status: 500 });
    }
}
