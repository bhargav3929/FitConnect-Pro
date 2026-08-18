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
        [1000, 118000, 18000, 100000],       // Demo Class
        [5000, 590000, 90000, 500000],       // Sol Intro Program
        [40800, 4814400, 734400, 4080000],   // 2x Weekly Quarterly
        [108000, 12744000, 1944000, 10800000],
    ])('adds 18%% to base %i', (base, total, gst, basePaise) => {
        const r = applyGstToRupees(base);
        expect(r.basePaise).toBe(basePaise);
        expect(r.gstPaise).toBe(gst);
        expect(r.totalPaise).toBe(total);
    });

    it('keeps founding prices exact to the paise', () => {
        // 34,680 + 18% = 40,922.40 - the case that rounding in rupees would lose.
        const r = applyGstToRupees(34680);
        expect(r.gstPaise).toBe(624240);
        expect(r.totalPaise).toBe(4092240);
        expect(r.totalPaise / 100).toBeCloseTo(40922.4, 2);
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
        expect(GST_RATE_PERCENT).toBe(18);
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
