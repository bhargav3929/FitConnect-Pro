const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the shared package for changes while preserving Expo defaults.
config.watchFolders = Array.from(new Set([
    ...(config.watchFolders ?? []),
    monorepoRoot,
]));

// Resolve packages from both mobile/node_modules and root/node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
];

// Force single copies of React packages to avoid duplicate React instances
// (root and mobile may have different versions hoisted)
config.resolver.extraNodeModules = {
    'react': path.resolve(monorepoRoot, 'node_modules/react'),
    'react-native': path.resolve(monorepoRoot, 'node_modules/react-native'),
    'react/jsx-runtime': path.resolve(monorepoRoot, 'node_modules/react/jsx-runtime'),
    'react/jsx-dev-runtime': path.resolve(monorepoRoot, 'node_modules/react/jsx-dev-runtime'),
};

// Enable package exports (for @fitconnect/shared exports map)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
