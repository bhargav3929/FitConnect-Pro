import { describe, it, expect } from 'vitest';
import { normalizePhone, isValidPhone, formatPhone } from '../../src/utils/phone';

describe('normalizePhone', () => {
    it.each([
        ['9876543210', '+919876543210'],
        ['98765 43210', '+919876543210'],
        ['+91 98765 43210', '+919876543210'],
        ['+919876543210', '+919876543210'],
        ['09876543210', '+919876543210'],
        ['0091 9876543210', '+919876543210'],
        ['(98765) 43210', '+919876543210'],
        ['98765-43210', '+919876543210'],
    ])('normalizes %s', (input, expected) => {
        expect(normalizePhone(input)).toBe(expected);
    });

    it.each([
        ['', 'empty'],
        ['12345', 'too short'],
        ['1234567890', 'landline-style leading digit'],
        ['5876543210', 'leading 5 is not a mobile prefix'],
        ['98765432101', 'eleven digits with no trunk prefix'],
        ['+1 415 555 2671', 'non-Indian country code'],
        ['abcdefghij', 'no digits at all'],
    ])('rejects %s (%s)', (input) => {
        expect(normalizePhone(input)).toBeNull();
        expect(isValidPhone(input)).toBe(false);
    });

    it('rejects a +91 number whose national part is not a mobile', () => {
        expect(normalizePhone('+91 1234567890')).toBeNull();
    });

    it('handles null and undefined', () => {
        expect(normalizePhone(null)).toBeNull();
        expect(normalizePhone(undefined)).toBeNull();
        expect(isValidPhone(null)).toBe(false);
    });
});

describe('formatPhone', () => {
    it('formats a stored number for display', () => {
        expect(formatPhone('+919876543210')).toBe('+91 98765 43210');
    });

    it('formats a raw national number', () => {
        expect(formatPhone('9876543210')).toBe('+91 98765 43210');
    });

    it('returns the input unchanged when it cannot be parsed', () => {
        expect(formatPhone('not a number')).toBe('not a number');
    });

    it('returns empty string for empty input', () => {
        expect(formatPhone(null)).toBe('');
    });
});
