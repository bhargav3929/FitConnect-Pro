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
    mutedLight: 'rgba(159,165,137,0.5)',
    secondaryText: semanticColors.secondaryText,
    success: semanticColors.success,
    successBg: semanticColors.successBg,
    error: semanticColors.error,
    errorBg: semanticColors.errorBg,
    warning: semanticColors.warning,
    white: semanticColors.white,
} as const;

// Font family strings usable directly in RN StyleSheet fontFamily.
// Note: for custom fonts to actually render on iOS/Android, the Expo app must
// load them via expo-font (see app/_layout.tsx). Until loaded, iOS falls back
// to the platform serif/sans.
export const FontFamily = {
    display: 'DMSerifDisplay_400Regular',
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
