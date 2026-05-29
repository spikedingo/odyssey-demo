# Plan 01 — Design System & UI Library

## Approach

Build the design system bottom-up: tokens first, then theme context, then primitives, then the UI Library showcase screen. Use React Native StyleSheet for all styles (not CSS-in-JS or Tailwind) to remain compatible with both web and native targets. Tokens are plain TypeScript objects; the theme system wraps them in a React context.

---

## File Structure

```
packages/ui/src/
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── radii.ts
│   ├── borders.ts
│   ├── shadows.ts
│   └── index.ts          # re-exports all tokens
├── theme/
│   ├── light.ts          # light theme: semantic color → token mapping
│   ├── dark.ts           # dark theme
│   ├── ThemeContext.tsx   # Provider + useTheme() hook
│   └── index.ts
├── density/
│   ├── DensityContext.tsx  # Provider + useDensity() hook
│   └── index.ts
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Select/
│   ├── Modal/
│   ├── Drawer/
│   ├── Card/
│   ├── DataTable/
│   ├── ListItem/
│   ├── Badge/
│   ├── Sidebar/
│   ├── NavItem/
│   ├── Breadcrumb/
│   ├── TabBar/
│   ├── Skeleton/
│   │   ├── SkeletonBox.tsx
│   │   ├── SkeletonText.tsx
│   │   ├── SkeletonCard.tsx
│   │   └── TableSkeleton.tsx
│   ├── Toast/
│   │   ├── Toast.tsx
│   │   ├── ToastContainer.tsx
│   │   └── useToast.ts
│   ├── Avatar/
│   ├── Divider/
│   ├── EmptyState/
│   ├── ErrorState/
│   ├── KPICard/
│   ├── PageHeader/
│   ├── SearchInput/
│   └── index.ts          # barrel export of all components
└── index.ts              # top-level barrel
```

---

## Step-by-Step

### 1. Token files

Write all token files as `const` TypeScript objects with `as const` to get literal types. Export from `tokens/index.ts`.

```ts
// tokens/colors.ts
export const palette = {
  primary: { 50: '#f0f7f0', ..., 500: '#3d8f3d', ... },
  neutral: { 0: '#ffffff', ..., 950: '#0d0c0a' },
  success: { light: '#22c55e', DEFAULT: '#16a34a', dark: '#15803d' },
  // ... warning, error, info, orderStatus
} as const;
```

### 2. Theme definitions

`theme/light.ts` and `theme/dark.ts` each export a `Theme` object conforming to the `Theme` type defined in `theme/types.ts`.

```ts
// theme/light.ts
import { palette } from '../tokens/colors';
export const lightTheme: Theme = {
  colors: {
    background:      palette.neutral[50],
    surface:         palette.neutral[0],
    surfaceElevated: palette.neutral[0],
    border:          palette.neutral[200],
    borderStrong:    palette.neutral[300],
    text:            palette.neutral[900],
    textSecondary:   palette.neutral[500],
    textDisabled:    palette.neutral[400],
    textInverse:     palette.neutral[0],
    primary:         palette.primary[500],
    primaryHover:    palette.primary[600],
    primaryPressed:  palette.primary[700],
    primarySubtle:   palette.primary[50],
    danger:          '#dc2626',
    dangerSubtle:    '#fef2f2',
    warning:         '#d97706',
    warningSubtle:   '#fffbeb',
    success:         '#16a34a',
    successSubtle:   '#f0fdf4',
  },
  shadows: { /* light shadows */ },
};
```

Dark theme inverts background/surface/text values using deeper neutral tones.

### 3. ThemeContext

```ts
// theme/ThemeContext.tsx
const ThemeContext = createContext<{ theme: Theme; mode: 'light' | 'dark'; toggle: () => void }>(null!);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>(systemScheme ?? 'light');
  const theme = mode === 'light' ? lightTheme : darkTheme;
  const toggle = () => setMode(m => m === 'light' ? 'dark' : 'light');
  return <ThemeContext.Provider value={{ theme, mode, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
```

### 4. DensityContext

```ts
// density/DensityContext.tsx
type Density = 'comfortable' | 'balanced' | 'compact';
const DensityContext = createContext<{ density: Density; setDensity: (d: Density) => void }>(null!);
```

Consumers call `useDensity()` and multiply spacing values by `densityScale[density]`.

### 5. Primitive components — implementation order

Build in this order (later components depend on earlier ones):

1. `Divider` — trivial horizontal line.
2. `Badge` — colored pill; uses theme colors for order status.
3. `Avatar` — initials box or image.
4. `SkeletonBox`, `SkeletonText`, `SkeletonCard`, `TableSkeleton` — animated shimmer.
5. `Toast` + `ToastContainer` + `useToast()` + `WarningBanner` — global notification and inline warning patterns.
6. `EmptyState`, `ErrorState` — feedback patterns.
7. `Button` — primary/secondary/ghost/danger × sm/md/lg × loading/disabled.
8. `Input` — text input with label, error, hint, icons.
9. `TextArea` — multi-line input, same states as Input.
10. `Switch` — boolean toggle with label and disabled state.
11. `Select` — dropdown wrapper.
10. `Card` / `KPICard`.
11. `ListItem`.
12. `DataTable` — columns, sortable headers, density-aware, loading skeleton.
13. `Modal` — centered overlay.
14. `Drawer` — right-side slide panel.
15. `NavItem`, `Sidebar`, `Breadcrumb`, `TabBar`.
16. `PageHeader`, `SearchInput`.

### 6. Shimmer animation

Use `react-native-reanimated` for the shimmer sweep animation on Skeleton components:

```ts
const shimmerAnim = useSharedValue(0);
useEffect(() => {
  shimmerAnim.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, false);
}, []);
```

On web, CSS `@keyframes` via `StyleSheet` or `Animated` API.

### 7. Web-specific styles

Use React Native's platform-specific patterns:
```ts
import { Platform } from 'react-native';
const webOnlyStyles = Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {};
```

Hover/focus states on web use `onMouseEnter`/`onMouseLeave` handlers.

### 8. UI Library screen

In `apps/dashboard/src/app/ui-library.tsx` (Expo Router file-based route):

```tsx
export default function UILibraryScreen() {
  return (
    <ScrollView>
      <SectionHeader title="Colors" />
      <ColorSwatches />
      <SectionHeader title="Typography" />
      <TypographySamples />
      {/* ... all sections from spec ... */}
    </ScrollView>
  );
}
```

Each section is a standalone component in `apps/dashboard/src/screens/UILibrary/`.

---

## Key Decisions

| Decision | Rationale |
|---|---|
| TypeScript token objects (not CSS vars) | React Native doesn't support CSS variables; TS objects work on all targets |
| `react-native-reanimated` for animations | Runs on the UI thread, smooth even on native; supported by Expo |
| Per-component `StyleSheet.create()` | Avoids style recalculation on every render |
| `Platform.OS === 'web'` guards | Keeps native bundle lean; web-only features (hover, cursor) don't break native |
| Barrel exports from `packages/ui` | Clean import paths: `import { Button } from '@odyssey/ui'` |
