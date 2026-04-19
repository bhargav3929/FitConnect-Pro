#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('node_modules/@expo/metro-runtime')) {
    console.log('[postinstall] @expo/metro-runtime not installed — skipping patch-package (web-only build).');
    process.exit(0);
}

const result = spawnSync('npx', ['patch-package'], { stdio: 'inherit' });
process.exit(result.status ?? 0);
