# Centralized Theme System

All colors used throughout the FitConnect Pro application are centralized in this folder.

## Files

- **`colors.ts`** — Core color definitions and theme presets
- **`index.ts`** — Central export point for all theme values

## Usage

### In Web Components (React)

For inline styles (avoid when possible, use Tailwind classes instead):

```tsx
import { COLORS, THEME_PRESETS } from '@fitconnect/shared/theme';

export function MyComponent() {
  return (
    <div style={{ color: COLORS.text.primary }}>
      Black text
    </div>
  );
}
```

### In Tailwind Classes

The colors are automatically available in Tailwind utilities:

```tsx
// These all use the centralized COLORS
<div className="text-olive-600">Black text</div>
<div className="bg-peach-100">Light background</div>
<div className="border-terra-400">Orange border</div>
```

### In Mobile Components (React Native)

```tsx
import { COLORS } from '@fitconnect/shared/theme';

export function MobileComponent() {
  return (
    <Text style={{ color: COLORS.text.primary }}>
      Black text
    </Text>
  );
}
```

## Color Reference

### Text Colors
- `COLORS.text.primary` — Black (default for all text)
- `COLORS.text.light` — Dark gray
- `COLORS.text.muted` — Medium gray
- `COLORS.text.inverse` — White (for dark backgrounds)

### Background Colors
- `COLORS.peach.*` — Light neutral backgrounds
- `COLORS.dark.*` — Dark theme surfaces

### Accent Colors
- `COLORS.primary.terra` — Orange (#FF6A3D)
- `COLORS.gold.*` — Orange variants

### Shadows & Borders
- `COLORS.shadow.*` — Shadow overlays
- `COLORS.border.*` — Border colors

## Rules

1. **Never use inline color values** — Always reference from COLORS
2. **Default text to black** — Use `COLORS.text.primary` for all text
3. **Use Tailwind classes** — Prefer `className="text-olive-600"` over inline styles
4. **Update this file first** — Changes to colors must go here first, then propagate

## Adding New Colors

If you need a new color:

1. Add it to the appropriate object in `shared/src/theme/colors.ts`
2. Update the Tailwind config to use it (if needed)
3. Document it in this README
4. Update all components that need it

Never add inline color values to components.
