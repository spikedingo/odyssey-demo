// Local route context for the monorepo: require.context must be relative to this file,
// not to expo-router inside node_modules (pnpm hoists break EXPO_ROUTER_APP_ROOT).
export const ctx = require.context(
  './src/app',
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)))\.[tj]sx?$).*(?:\.android|\.ios|\.native|\.web)?\.[tj]sx?$/,
);
