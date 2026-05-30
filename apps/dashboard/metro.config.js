const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const resolvePaths = [projectRoot, workspaceRoot];

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

function resolvePackage(name) {
  return path.dirname(
    require.resolve(`${name}/package.json`, {
      paths: resolvePaths,
    }),
  );
}

function buildExtraNodeModules() {
  const extra = {};
  const dashboardPkg = require('./package.json');
  const deps = [
    ...Object.keys(dashboardPkg.dependencies ?? {}),
    ...Object.keys(dashboardPkg.devDependencies ?? {}),
    '@expo/metro-runtime',
  ];

  for (const pkg of deps) {
    if (pkg.startsWith('@odyssey/')) continue;
    try {
      extra[pkg] = resolvePackage(pkg);
    } catch {
      // workspace or optional during partial install
    }
  }

  // Transitive Expo dep not listed in dashboard package.json
  if (!extra['@expo/metro-runtime']) {
    try {
      const expoDir = resolvePackage('expo');
      extra['@expo/metro-runtime'] = path.dirname(
        require.resolve('@expo/metro-runtime/package.json', { paths: [expoDir] }),
      );
    } catch {
      // optional during tooling without a full install
    }
  }

  return extra;
}

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...buildExtraNodeModules(),
};

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
