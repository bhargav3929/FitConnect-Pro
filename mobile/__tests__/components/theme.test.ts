import { describe, it, expect } from 'vitest';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { palette } from '@fitconnect/shared/design/tokens';

describe('Theme constants', () => {
    describe('Colors', () => {
        it('sources primary palette colors from canonical tokens', () => {
            expect(Colors.primary).toBe(palette.terra[400]);
            expect(Colors.primaryLight).toBe(palette.terra[300]);
            expect(Colors.warning).toBe(palette.warning);
        });

        it('has semantic colors', () => {
            expect(Colors.background).toBeDefined();
            expect(Colors.foreground).toBeDefined();
            expect(Colors.primary).toBeDefined();
            expect(Colors.card).toBeDefined();
            expect(Colors.border).toBeDefined();
            expect(Colors.muted).toBeDefined();
            expect(Colors.success).toBeDefined();
            expect(Colors.error).toBeDefined();
            expect(Colors.warning).toBeDefined();
        });

        it('has valid hex color format for all semantic colors', () => {
            const hexRegex = /^#[0-9A-Fa-f]{6}$/;
            expect(Colors.background).toMatch(hexRegex);
            expect(Colors.foreground).toMatch(hexRegex);
            expect(Colors.primary).toMatch(hexRegex);
            expect(Colors.card).toMatch(hexRegex);
            expect(Colors.error).toMatch(hexRegex);
            expect(Colors.success).toMatch(hexRegex);
        });

        it('has SOL Pilates palette nested colors', () => {
            expect(Colors.peach[100]).toBeDefined();
            expect(Colors.olive[400]).toBeDefined();
            expect(Colors.terra[400]).toBeDefined();
            expect(Colors.warmDark[800]).toBeDefined();
        });
    });

    describe('Spacing', () => {
        it('has all size tokens', () => {
            expect(Spacing.xs).toBe(4);
            expect(Spacing.sm).toBe(8);
            expect(Spacing.md).toBe(16);
            expect(Spacing.lg).toBe(24);
            expect(Spacing.xl).toBe(32);
            expect(Spacing['2xl']).toBe(48);
            expect(Spacing['3xl']).toBe(64);
        });

        it('scales progressively', () => {
            expect(Spacing.sm).toBeGreaterThan(Spacing.xs);
            expect(Spacing.md).toBeGreaterThan(Spacing.sm);
            expect(Spacing.lg).toBeGreaterThan(Spacing.md);
            expect(Spacing.xl).toBeGreaterThan(Spacing.lg);
            expect(Spacing['2xl']).toBeGreaterThan(Spacing.xl);
            expect(Spacing['3xl']).toBeGreaterThan(Spacing['2xl']);
        });
    });

    describe('FontSize', () => {
        it('has all size tokens', () => {
            expect(FontSize.xs).toBe(12);
            expect(FontSize.sm).toBe(14);
            expect(FontSize.base).toBe(16);
            expect(FontSize.lg).toBe(18);
            expect(FontSize.xl).toBe(20);
            expect(FontSize['2xl']).toBe(24);
            expect(FontSize['3xl']).toBe(30);
            expect(FontSize['4xl']).toBe(36);
        });

        it('scales progressively', () => {
            const sizes = [
                FontSize.xs,
                FontSize.sm,
                FontSize.base,
                FontSize.lg,
                FontSize.xl,
                FontSize['2xl'],
                FontSize['3xl'],
                FontSize['4xl'],
            ];
            for (let i = 1; i < sizes.length; i++) {
                expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
            }
        });
    });

    describe('BorderRadius', () => {
        it('has all radius tokens', () => {
            expect(BorderRadius.sm).toBe(4);
            expect(BorderRadius.md).toBe(8);
            expect(BorderRadius.lg).toBe(12);
            expect(BorderRadius.xl).toBe(16);
            expect(BorderRadius.full).toBe(9999);
        });

        it('full is very large for pill shapes', () => {
            expect(BorderRadius.full).toBeGreaterThan(1000);
        });
    });
});
