// ---------------------------------------------------------------------------
// Mock Payment Processor
// When Stripe arrives, replace this file — nothing else changes.
// ---------------------------------------------------------------------------

export interface MockCardInput {
    cardNumber: string;
    expiry: string;
    cvc: string;
    name: string;
}

export interface MockPaymentResult {
    success: boolean;
    paymentIntentId: string;
    error?: string;
}

function generatePaymentIntentId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'pi_mock_';
    for (let i = 0; i < 24; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Simulate payment processing.
 * - Cards ending in 0000 → decline
 * - Everything else → success after simulated delay
 */
export async function processPayment(
    _amountDollars: number,
    _card?: MockCardInput,
): Promise<MockPaymentResult> {
    // Simulate network delay (server-side: shorter)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const paymentIntentId = generatePaymentIntentId();

    // Decline test: card number ending in 0000
    if (_card?.cardNumber?.replace(/\s/g, '').endsWith('0000')) {
        return {
            success: false,
            paymentIntentId,
            error: 'Your card was declined. Please try a different card.',
        };
    }

    return {
        success: true,
        paymentIntentId,
    };
}
