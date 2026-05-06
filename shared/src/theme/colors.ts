/**
 * Centralized Color System
 *
 * Palette values come from shared/src/design/tokens.json (the canonical source
 * also consumed by build-tokens.mjs to emit tokens.generated.css and by mobile
 * via tokens.ts). This module shapes the palette into a web-friendly COLORS
 * object plus THEME_PRESETS.
 *
 * Never use inline colors in components — always reference from this file.
 */

import { palette } from '../design/tokens';

export const COLORS = {
  // Primary Brand Colors
  primary: {
    terra: palette.terra[400],
    terraLight: palette.terra[300],
    terraDark: palette.terra[500],
    terraDarker: palette.terra[600],
  },

  // Backgrounds & Surfaces
  background: {
    light: palette.peach[50],
    lightest: '#FAFAF8',
    lighter: palette.peach[100],
    default: palette.peach[300],
    muted: palette.peach[400],
    dark: palette.peach[500],
  },
  beige: palette.peach[50],

  // Text & Foreground
  text: {
    primary: '#000000',
    light: palette.olive[600],
    lighter: palette.olive[500],
    muted: palette.olive[400],
    mutedLight: palette.olive[300],
    inverse: palette.white,
  },

  // Dark Theme Surfaces
  dark: {
    bg: '#0B0F19',
    surface: '#1A1F2E',
    surfaceLight: '#252B3B',
    text: '#F0D8C0',
    border: '#3B2F28',
  },

  // Semantic Colors
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  errorHover: palette.errorHover,
  info: '#3B82F6',

  // Peach Scale (light beige backgrounds)
  peach: palette.peach,

  // Olive Scale (neutral grays)
  olive: palette.olive,

  // Gold/Terra (accent oranges)
  gold: {
    300: palette.terra[300],
    400: palette.terra[400],
    500: palette.terra[500],
  },

  // Borders
  border: {
    light: palette.peach[400],
    default: palette.peach[500],
    dark: palette.olive[300],
  },

  // Shadows
  shadow: {
    sm: 'rgba(0, 0, 0, 0.05)',
    md: 'rgba(0, 0, 0, 0.1)',
    lg: 'rgba(0, 0, 0, 0.15)',
    xl: 'rgba(0, 0, 0, 0.2)',
  },
} as const;

/**
 * Theme Presets for Different Contexts
 */
export const THEME_PRESETS = {
  light: {
    bg: COLORS.background.light,
    text: COLORS.text.primary,
    border: COLORS.border.light,
    surface: COLORS.peach[100],
  },
  dark: {
    bg: COLORS.dark.bg,
    text: COLORS.dark.text,
    border: COLORS.dark.border,
    surface: COLORS.dark.surface,
  },
  input: {
    bg: COLORS.peach[50],
    text: COLORS.text.primary,
    border: COLORS.border.default,
    focusBorder: COLORS.primary.terra,
    placeholder: COLORS.text.muted,
  },
  button: {
    primary: {
      bg: COLORS.primary.terra,
      text: COLORS.text.inverse,
      border: COLORS.primary.terra,
      hover: COLORS.primary.terraDark,
    },
    secondary: {
      bg: COLORS.background.lighter,
      text: COLORS.text.primary,
      border: COLORS.border.default,
      hover: COLORS.background.default,
    },
  },
  card: {
    bg: COLORS.peach[100],
    text: COLORS.text.primary,
    border: COLORS.border.light,
    shadow: COLORS.shadow.md,
  },
} as const;

export type ColorKey = keyof typeof COLORS;
export type ThemePresetKey = keyof typeof THEME_PRESETS;

export function withAlpha(hexColor: string, alpha: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const CHART_THEME = {
  gridLine: withAlpha(COLORS.olive[400], 0.08),
  axisStroke: withAlpha(COLORS.olive[400], 0.4),
  axisStrokeMuted: withAlpha(COLORS.olive[400], 0.3),
  cursorFill: withAlpha(COLORS.olive[400], 0.04),
  cursorFillMuted: withAlpha(COLORS.olive[400], 0.03),
  tooltipBg: COLORS.peach[50],
  tooltipBorder: withAlpha(COLORS.peach[500], 0.3),
  tooltipBorderLight: withAlpha(COLORS.peach[500], 0.2),
  tooltipShadow: `0 10px 40px -10px ${withAlpha('#000000', 0.1)}`,
  tooltipShadowSm: `0 8px 32px -8px ${withAlpha('#000000', 0.08)}`,
  bar: COLORS.primary.terraDarker,
  itemText: COLORS.olive[500],
} as const;

export const TIER_COLORS = {
  bronze:   { color: '#C4956A', bgAlpha: 0.15 },
  silver:   { color: '#B07D4F', bgAlpha: 0.15 },
  gold:     { color: '#9E6839', bgAlpha: 0.18 },
  platinum: { color: '#8B4F2C', bgAlpha: 0.18 },
  diamond:  { color: '#6F3520', bgAlpha: 0.20 },
} as const;
