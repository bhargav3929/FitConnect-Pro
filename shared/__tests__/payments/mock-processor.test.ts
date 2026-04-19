import { describe, it, expect } from 'vitest';
import {
    processPayment,
    type MockCardInput,
    type MockPaymentResult,
} from '../../src/payments/mock-processor';

describe('processPayment', () => {
    it('returns success for default (no card) payment', async () => {
        const result = await processPayment(100);
        expect(result.success).toBe(true);
        expect(result.paymentIntentId).toMatch(/^pi_mock_/);
        expect(result.error).toBeUndefined();
    });

    it('returns success for valid card', async () => {
        const card: MockCardInput = {
            cardNumber: '4242 4242 4242 4242',
            expiry: '12/25',
            cvc: '123',
            name: 'Test User',
        };
        const result = await processPayment(50, card);
        expect(result.success).toBe(true);
        expect(result.paymentIntentId).toMatch(/^pi_mock_/);
    });

    it('declines card ending in 0000', async () => {
        const card: MockCardInput = {
            cardNumber: '4242 4242 4242 0000',
            expiry: '12/25',
            cvc: '123',
            name: 'Test User',
        };
        const result = await processPayment(100, card);
        expect(result.success).toBe(false);
        expect(result.error).toContain('declined');
    });

    it('generates unique payment intent IDs', async () => {
        const r1 = await processPayment(100);
        const r2 = await processPayment(100);
        expect(r1.paymentIntentId).not.toBe(r2.paymentIntentId);
    });

    it('payment intent ID has correct format', async () => {
        const result = await processPayment(100);
        expect(result.paymentIntentId).toMatch(/^pi_mock_[A-Za-z0-9]{24}$/);
    });

    it('handles zero amount', async () => {
        const result = await processPayment(0);
        expect(result.success).toBe(true);
    });

    it('handles card number without spaces', async () => {
        const card: MockCardInput = {
            cardNumber: '4242424242420000',
            expiry: '12/25',
            cvc: '123',
            name: 'Test User',
        };
        const result = await processPayment(100, card);
        expect(result.success).toBe(false);
    });
});
