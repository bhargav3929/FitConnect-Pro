import tokens from './tokens.json';

export const palette = tokens.palette;
export const fonts = tokens.fonts;
export const fontSize = tokens.fontSize;
export const spacing = tokens.spacing;
export const radius = tokens.radius;

export const semanticColors = {
    background: palette.peach[100],
    foreground: palette.olive[400],
    card: palette.peach[50],
    cardAlt: palette.peach[300],
    primary: palette.terra[400],
    primaryHover: palette.terra[300],
    primaryDark: palette.terra[500],
    accent: palette.terra[400],
    muted: palette.olive[300],
    secondaryText: palette.olive[400],
    border: palette.peach[400],
    borderLight: 'rgba(212,180,148,0.15)',
    borderMedium: 'rgba(212,180,148,0.20)',
    borderHeavy: 'rgba(212,180,148,0.30)',
    success: palette.success,
    successBg: 'rgba(34,197,94,0.15)',
    error: palette.error,
    errorBg: 'rgba(239,68,68,0.15)',
    warning: palette.warning,
    white: palette.white,
} as const;

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    lg: {
        shadowColor: palette.terra[400],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
    },
} as const;

export type Palette = typeof palette;
export type SemanticColors = typeof semanticColors;
export type FontSize = keyof typeof fontSize;
export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
