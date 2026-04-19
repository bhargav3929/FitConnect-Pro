#!/usr/bin/env node
// Regenerate tokens.generated.css from tokens.json.
// Run from repo root: `npm run build:tokens` (or `node shared/src/design/build-tokens.mjs`).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(resolve(__dirname, 'tokens.json'), 'utf8'));

const lines = [
    '/* AUTO-GENERATED from shared/src/design/tokens.json — do not edit by hand.',
    '   Run `npm run build:tokens` to regenerate. */',
    '',
    ':root {',
];

for (const [scale, values] of Object.entries(tokens.palette)) {
    if (typeof values === 'object') {
        for (const [step, hex] of Object.entries(values)) {
            lines.push(`    --color-${scale}-${step}: ${hex};`);
        }
    } else {
        lines.push(`    --color-${scale}: ${values};`);
    }
}
lines.push('');

for (const [name, value] of Object.entries(tokens.fonts)) {
    lines.push(`    --font-${name}: ${value};`);
}
lines.push('');

for (const [name, value] of Object.entries(tokens.fontSize)) {
    lines.push(`    --font-size-${name}: ${value}px;`);
}
lines.push('');

for (const [name, value] of Object.entries(tokens.spacing)) {
    lines.push(`    --space-${name}: ${value}px;`);
}
lines.push('');

for (const [name, value] of Object.entries(tokens.radius)) {
    lines.push(`    --radius-${name}: ${value === 9999 ? '9999px' : value + 'px'};`);
}

lines.push('}');
lines.push('');

writeFileSync(resolve(__dirname, 'tokens.generated.css'), lines.join('\n'));
console.log('Wrote tokens.generated.css');
