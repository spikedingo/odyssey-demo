const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

try {
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    '@react-native/assets-registry': path.dirname(
      require.resolve('@react-native/assets-registry/package.json', {
        paths: [projectRoot, workspaceRoot],
      }),
    ),
  };
} catch {
  // optional during tooling without a full install
}

// pnpm stores packages under .pnpm; Expo HTML references that path but Metro serves the hoisted path.
config.server = {
  ...config.server,
  rewriteRequestUrl: (url) => {
    if (url.includes('.pnpm/') && url.includes('expo-router') && url.includes('entry.bundle')) {
      const qs = url.includes('?') ? url.slice(url.indexOf('?')) : '';
      return `/node_modules/expo-router/entry.bundle${qs}`;
    }
    return url;
  },
};

module.exports = config;
