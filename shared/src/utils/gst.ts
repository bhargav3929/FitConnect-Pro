/**
 * GST on class packs and memberships.
 *
 * Prices in PLAN_CATALOG are GST-exclusive base amounts: the customer pays the
 * base plus GST on top. All arithmetic happens in paise because several founding
 * prices do not land on a whole rupee once GST is applied (34,680 + 18% =
 * 40,922.40), and Razorpay charges in paise anyway. Working in rupees and
 * rounding at the end loses up to a rupee per transaction and makes the invoice
 * total disagree with the sum of its lines.
 */

/** 18% expressed in basis points, so the rate stays exact in integer maths. */
export const GST_RATE_BPS = 1800;

export const GST_RATE_PERCENT = GST_RATE_BPS / 100;

export interface GstBreakdown {
    /** GST-exclusive amount, in paise. */
    basePaise: number;
    /** GST charged on the base, in paise. */
    gstPaise: number;
    /** What the customer actually pays, in paise. */
    totalPaise: number;
}

export function rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
    return paise / 100;
}

/**
 * Splits a GST-exclusive base amount into base + GST + total.
 * The total is derived by addition, so it always equals the sum of the lines.
 */
export function applyGstToPaise(basePaise: number): GstBreakdown {
    const safeBase = Math.max(0, Math.round(basePaise));
    const gstPaise = Math.round((safeBase * GST_RATE_BPS) / 10000);
    return {
        basePaise: safeBase,
        gstPaise,
        totalPaise: safeBase + gstPaise,
    };
}

/** Convenience wrapper for the rupee-denominated prices in PLAN_CATALOG. */
export function applyGstToRupees(baseRupees: number): GstBreakdown {
    return applyGstToPaise(rupeesToPaise(baseRupees));
}

/**
 * Formats paise as INR for display. Whole-rupee amounts render without decimals
 * so the common case stays clean; fractional amounts keep both places.
 */
export function formatPaise(paise: number): string {
    const rupees = paiseToRupees(paise);
    const hasFraction = paise % 100 !== 0;
    return `₹${rupees.toLocaleString('en-IN', {
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
}
