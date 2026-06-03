// Thin re-export over @fitconnect/shared/design/tokens so RN screens keep the
// ergonomic Colors/Spacing/FontSize/BorderRadius/Shadows API they already use.
// To change a token, edit shared/src/design/tokens.json (single source of truth).

import {
    palette,
    semanticColors,
    fonts,
    fontSize as sharedFontSize,
    spacing as sharedSpacing,
    radius as sharedRadius,
    shadows,
} from '@fitconnect/shared/design/tokens';
import { withAlpha, TIER_COLORS } from '@fitconnect/shared/theme';

export { TIER_COLORS };

// Pre-composed alpha aliases for RN style props that can't compute at runtime.
// All values sourced from palette.* via withAlpha — never inline rgba() in screens.
export const Alpha = {
    peach400_10: withAlpha(palette.peach[400], 0.10),
    peach400_12: withAlpha(palette.peach[400], 0.12),
    peach400_20: withAlpha(palette.peach[400], 0.20),
    peach400_30: withAlpha(palette.peach[400], 0.30),
    peach400_35: withAlpha(palette.peach[400], 0.35),
    peach300_30: withAlpha(palette.peach[300], 0.30),
    peach300_40: withAlpha(palette.peach[300], 0.40),
    peach300_50: withAlpha(palette.peach[300], 0.50),
    peach200_30: withAlpha(palette.peach[200], 0.30),
    peach200_40: withAlpha(palette.peach[200], 0.40),
    peach200_50: withAlpha(palette.peach[200], 0.50),
    peach200_60: withAlpha(palette.peach[200], 0.60),
    peach100_05: withAlpha(palette.peach[100], 0.05),
    peach100_07: withAlpha(palette.peach[100], 0.07),
    peach100_10: withAlpha(palette.peach[100], 0.10),
    peach100_12: withAlpha(palette.peach[100], 0.12),
    peach100_15: withAlpha(palette.peach[100], 0.15),
    peach100_55: withAlpha(palette.peach[100], 0.55),
    peach100_75: withAlpha(palette.peach[100], 0.75),
    peach50_10: withAlpha(palette.peach[50], 0.10),
    peach50_15: withAlpha(palette.peach[50], 0.15),
    olive400_05: withAlpha(palette.olive[400], 0.05),
    olive400_06: withAlpha(palette.olive[400], 0.06),
    olive400_08: withAlpha(palette.olive[400], 0.08),
    olive400_10: withAlpha(palette.olive[400], 0.10),
    olive400_12: withAlpha(palette.olive[400], 0.12),
    olive400_18: withAlpha(palette.olive[400], 0.18),
    olive400_20: withAlpha(palette.olive[400], 0.20),
    olive400_25: withAlpha(palette.olive[400], 0.25),
    olive400_40: withAlpha(palette.olive[400], 0.40),
    olive300_40: withAlpha(palette.olive[300], 0.40),
    olive300_50: withAlpha(palette.olive[300], 0.50),
    olive300_60: withAlpha(palette.olive[300], 0.60),
    olive300_70: withAlpha(palette.olive[300], 0.70),
    olive300_80: withAlpha(palette.olive[300], 0.80),
    terra400_07: withAlpha(palette.terra[400], 0.07),
    terra400_10: withAlpha(palette.terra[400], 0.10),
    terra400_12: withAlpha(palette.terra[400], 0.12),
    terra400_15: withAlpha(palette.terra[400], 0.15),
    terra400_18: withAlpha(palette.terra[400], 0.18),
    terra400_20: withAlpha(palette.terra[400], 0.20),
    terra500_10: withAlpha(palette.terra[500], 0.10),
    white_10: withAlpha(palette.white, 0.10),
    white_12: withAlpha(palette.white, 0.12),
    white_15: withAlpha(palette.white, 0.15),
    white_18: withAlpha(palette.white, 0.18),
    white_75: withAlpha(palette.white, 0.75),
    white_80: withAlpha(palette.white, 0.80),
    black_50: withAlpha('#000000', 0.50),
    error_10: withAlpha(palette.error, 0.10),
    error_20: withAlpha(palette.error, 0.20),
    error_25: withAlpha(palette.error, 0.25),
    // dark overlay for image gradients (sourced from olive[700], the darkest token)
    dark_80: withAlpha(palette.olive[700], 0.80),
} as const;

export const Colors = {
    peach: palette.peach,
    olive: palette.olive,
    terra: palette.terra,
    warmDark: palette.warmDark,

    background: semanticColors.background,
    foreground: semanticColors.foreground,
    card: semanticColors.card,
    cardAlt: semanticColors.cardAlt,
    primary: semanticColors.primary,
    primaryLight: semanticColors.primaryHover,
    border: semanticColors.border,
    borderLight: semanticColors.borderLight,
    borderMedium: semanticColors.borderMedium,
    borderHeavy: semanticColors.borderHeavy,
    muted: semanticColors.muted,
    mutedLight: withAlpha(palette.olive[300], 0.5),
    secondaryText: semanticColors.secondaryText,
    success: semanticColors.success,
    successBg: semanticColors.successBg,
    error: semanticColors.error,
    errorBg: semanticColors.errorBg,
    warning: semanticColors.warning,
    white: semanticColors.white,
} as const;

// Font family strings usable directly in RN StyleSheet fontFamily.
// Custom fonts are loaded in app/_layout.tsx before screens render.
export const FontFamily = {
    display: 'PlusJakartaSans_700Bold',
    sans: 'PlusJakartaSans_400Regular',
    sansMedium: 'PlusJakartaSans_500Medium',
    sansBold: 'PlusJakartaSans_700Bold',
    sansExtra: 'PlusJakartaSans_800ExtraBold',
    _cssDisplay: fonts.display,
    _cssSans: fonts.sans,
} as const;

export const Spacing = sharedSpacing;
export const FontSize = sharedFontSize;
export const BorderRadius = sharedRadius;
export const Shadows = shadows;
