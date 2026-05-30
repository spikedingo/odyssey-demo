// Metro resolves `expo-router/entry` as a package name (see metro.config.js).
// Do not use `main: "expo-router/entry"` — Expo expands it to `./node_modules/...`,
// which breaks when app-level node_modules are pnpm symlinks.
import 'expo-router/entry';
