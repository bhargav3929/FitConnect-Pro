import { describe, it, expect } from 'vitest';
import {
    applyGstToRupees,
    applyGstToPaise,
    formatPaise,
    rupeesToPaise,
    GST_RATE_PERCENT,
} from '../../src/utils/gst';
import { PLAN_CATALOG } from '../../src/types/subscription';

describe('applyGstToRupees', () => {
    it.each([
        [1000, 105000, 5000, 100000],        // Demo Class
        [5000, 525000, 25000, 500000],       // Sol Intro Program
        [40800, 4284000, 204000, 4080000],   // 2x Weekly Quarterly
        [108000, 11340000, 540000, 10800000],
    ])('adds 5%% to base %i', (base, total, gst, basePaise) => {
        const r = applyGstToRupees(base);
        expect(r.basePaise).toBe(basePaise);
        expect(r.gstPaise).toBe(gst);
        expect(r.totalPaise).toBe(total);
    });

    it('keeps sub-rupee amounts exact to the paise', () => {
        // 1,234.50 + 5% = 1,296.225 - the case that rounding in rupees would lose.
        const r = applyGstToPaise(123450);
        expect(r.gstPaise).toBe(6173);
        expect(r.totalPaise).toBe(129623);
    });

    it('applies the founding price cleanly', () => {
        const r = applyGstToRupees(34680);
        expect(r.gstPaise).toBe(173400);
        expect(r.totalPaise).toBe(3641400);
    });

    it('always has total equal to base plus gst', () => {
        for (const plan of PLAN_CATALOG) {
            for (const price of [plan.price, plan.foundingPrice ?? plan.price]) {
                const r = applyGstToRupees(price);
                expect(r.totalPaise).toBe(r.basePaise + r.gstPaise);
            }
        }
    });

    it('handles zero', () => {
        expect(applyGstToRupees(0)).toEqual({ basePaise: 0, gstPaise: 0, totalPaise: 0 });
    });

    it('never produces a negative charge', () => {
        expect(applyGstToPaise(-500).totalPaise).toBe(0);
    });

    it('exposes the rate as a percentage for display', () => {
        expect(GST_RATE_PERCENT).toBe(5);
    });
});

describe('formatPaise', () => {
    it('renders whole rupees without decimals', () => {
        expect(formatPaise(590000)).toBe('₹5,900');
    });

    it('keeps paise when the amount is fractional', () => {
        expect(formatPaise(4092240)).toBe('₹40,922.40');
    });

    it('uses the Indian digit grouping', () => {
        expect(formatPaise(rupeesToPaise(127440))).toBe('₹1,27,440');
    });
});
