/**
 * Phone number handling for Indian mobile numbers.
 *
 * Members are stored with a single canonical E.164 value (+91XXXXXXXXXX) so that
 * admin search, Razorpay payer contacts and WhatsApp links all compare equal.
 * Input is deliberately forgiving - people type "98765 43210", "098765-43210",
 * "+91 98765 43210" - and normalization happens once, on save.
 */

const INDIA_DIALLING_CODE = '91';

/** Indian mobile numbers are 10 digits and start with 6, 7, 8 or 9. */
const NATIONAL_NUMBER = /^[6-9]\d{9}$/;

/**
 * Reduces any accepted spelling to its 10 national digits, or null when the
 * input cannot be an Indian mobile number.
 */
function toNationalDigits(input: string): string | null {
    const digits = input.replace(/\D/g, '');

    // +91XXXXXXXXXX / 0091XXXXXXXXXX
    if (digits.length === 12 && digits.startsWith(INDIA_DIALLING_CODE)) {
        const national = digits.slice(2);
        return NATIONAL_NUMBER.test(national) ? national : null;
    }
    if (digits.length === 14 && digits.startsWith('00' + INDIA_DIALLING_CODE)) {
        const national = digits.slice(4);
        return NATIONAL_NUMBER.test(national) ? national : null;
    }

    // 0XXXXXXXXXX - the trunk prefix used when dialling domestically
    if (digits.length === 11 && digits.startsWith('0')) {
        const national = digits.slice(1);
        return NATIONAL_NUMBER.test(national) ? national : null;
    }

    if (digits.length === 10) {
        return NATIONAL_NUMBER.test(digits) ? digits : null;
    }

    return null;
}

export function isValidPhone(input: string | null | undefined): boolean {
    return !!input && toNationalDigits(input) !== null;
}

/**
 * Canonical storage form: +91XXXXXXXXXX. Returns null for anything invalid, so
 * callers must decide what to do rather than silently storing junk.
 */
export function normalizePhone(input: string | null | undefined): string | null {
    if (!input) return null;
    const national = toNationalDigits(input);
    return national ? `+${INDIA_DIALLING_CODE}${national}` : null;
}

/** Display form: +91 98765 43210. Falls back to the raw value if unparseable. */
export function formatPhone(input: string | null | undefined): string {
    if (!input) return '';
    const national = toNationalDigits(input);
    if (!national) return input;
    return `+${INDIA_DIALLING_CODE} ${national.slice(0, 5)} ${national.slice(5)}`;
}

export const PHONE_VALIDATION_MESSAGE = 'Enter a valid 10-digit Indian mobile number';
