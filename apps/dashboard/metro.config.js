const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const resolvePaths = [projectRoot, workspaceRoot];

const config = getDefaultConfig(projectRoot);

const ROUTER_ROOT = 'src/app';
const defaultGetTransformOptions = config.transformer?.getTransformOptions;

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => {
    const base = defaultGetTransformOptions
      ? await defaultGetTransformOptions()
      : { transform: { experimentalImportSupport: false, inlineRequires: false } };
    return {
      ...base,
      customTransformOptions: {
        ...base.customTransformOptions,
        routerRoot: ROUTER_ROOT,
      },
    };
  },
};

// pnpm hoists most deps to the repo root; app-level node_modules entries are often symlinks.
// Disabling symlink following avoids readlink EINVAL on hoisted real directories, but then
// relative `./node_modules/<pkg>` entry paths fail — use index.js + extraNodeModules instead.
config.resolver.unstable_enableSymlinks = false;

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

function resolvePackage(name) {
  return path.dirname(
    require.resolve(`${name}/package.json`, {
      paths: resolvePaths,
    }),
  );
}

const WORKSPACE_PACKAGES = {
  '@odyssey/api-client': path.resolve(workspaceRoot, 'packages/api-client'),
  '@odyssey/shared': path.resolve(workspaceRoot, 'packages/shared'),
  '@odyssey/types': path.resolve(workspaceRoot, 'packages/types'),
  '@odyssey/ui': path.resolve(workspaceRoot, 'packages/ui'),
};

function buildExtraNodeModules() {
  const extra = { ...WORKSPACE_PACKAGES };
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
      // optional during partial install
    }
  }

  if (!extra['@expo/metro-runtime']) {
    try {
      const expoDir = resolvePackage('expo');
      extra['@expo/metro-runtime'] = path.dirname(
        require.resolve('@expo/metro-runtime/package.json', { paths: [expoDir] }),
      );
    } catch {
      // optional
    }
  }

  return extra;
}

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...buildExtraNodeModules(),
};

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // expo-router/_ctx uses a path relative to node_modules/expo-router — broken in pnpm monorepos.
  if (moduleName === 'expo-router/_ctx' || moduleName.startsWith('expo-router/_ctx.')) {
    return {
      filePath: path.join(projectRoot, 'expo-router-ctx.js'),
      type: 'sourceFile',
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.server = {
  ...config.server,
  rewriteRequestUrl: (url) => {
    let next = url;

    if (next.includes('.pnpm/') && next.includes('expo-router') && next.includes('entry.bundle')) {
      const qs = next.includes('?') ? next.slice(next.indexOf('?')) : '';
      next = `/node_modules/expo-router/entry.bundle${qs}`;
    }

    // Custom entry is index.js — ensure routerRoot is always passed to the Babel plugin.
    if (next.includes('index.bundle')) {
      try {
        const urlObj = next.startsWith('/') ? new URL(next, 'http://localhost') : new URL(next);
        if (!urlObj.searchParams.has('transform.routerRoot')) {
          urlObj.searchParams.set('transform.routerRoot', ROUTER_ROOT);
        }
        next = next.startsWith('/') ? urlObj.pathname + urlObj.search : urlObj.toString();
      } catch {
        // keep original url
      }
    }

    return next;
  },
};

module.exports = config;
