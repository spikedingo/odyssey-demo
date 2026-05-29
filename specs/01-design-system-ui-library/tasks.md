# Tasks 01 — Design System & UI Library

## Token System

- [x] `packages/ui/src/tokens/colors.ts` — palette (primary sage green, neutral warm gray, semantic, orderStatus)
- [x] `packages/ui/src/tokens/typography.ts` — fontFamily (Inter variants), fontSize, lineHeight, fontWeight
- [ ] `packages/ui/src/tokens/spacing.ts` — 4px base grid, all named steps 0–20
- [ ] `packages/ui/src/tokens/radii.ts` — none/sm/md/lg/xl/2xl/full
- [ ] `packages/ui/src/tokens/borders.ts` — width values
- [ ] `packages/ui/src/tokens/shadows.ts` — none/sm/md/lg with RN shadow props
- [ ] `packages/ui/src/tokens/index.ts` — barrel re-export

## Theme System

- [ ] `packages/ui/src/theme/types.ts` — `Theme` interface definition
- [ ] `packages/ui/src/theme/light.ts` — light theme mapping
- [ ] `packages/ui/src/theme/dark.ts` — dark theme mapping
- [ ] `packages/ui/src/theme/ThemeContext.tsx` — Provider + `useTheme()` hook, reads system preference
- [ ] `packages/ui/src/theme/index.ts` — barrel re-export

## Density System

- [x] `packages/ui/src/density/DensityContext.tsx` — Provider + `useDensity()` hook, default `'balanced'`
- [ ] `packages/ui/src/density/index.ts` — barrel re-export

## Primitive Components

- [x] `Divider` — horizontal rule, uses border token
- [x] `Badge` — colored pill, all variants + order status colors
- [ ] `Avatar` — initials (sm/md/lg), fallback to image
- [x] `SkeletonBox` — animated shimmer rectangle
- [x] `SkeletonText` — animated shimmer text line
- [x] `SkeletonCard` — card-shaped skeleton
- [x] `TableSkeleton` — configurable-row skeleton table
- [x] `Toast` — individual toast (success/error/warning/info, auto-dismiss 4s, close button)
- [x] `ToastContainer` — portal anchored to bottom-right
- [x] `useToast()` — hook with `success()`, `error()`, `warning()`, `info()` methods
- [x] `WarningBanner` — inline amber banner, message, optional action, dismissible
- [x] `EmptyState` — icon + heading + subtext + optional action
- [x] `ErrorState` — error icon + message + retry button
- [x] `Button` — primary/secondary/ghost/danger × sm/md/lg × loading × disabled; hover/focus/active states on web
- [x] `Input` — label, value, error, hint, leftIcon, rightElement, disabled; focused ring state on web
- [x] `TextArea` — multi-line input, same states as Input, configurable rows/maxLength
- [x] `Switch` — boolean toggle with label, hint, disabled state
- [x] `Select` — dropdown with label, options, error, disabled
- [x] `Card` — elevation none/sm/md, optional onPress
- [x] `KPICard` — metric label + large value + optional trend (up/down + %)
- [ ] `ListItem` — icon, primary text, secondary text, right element, onPress
- [ ] `DataTable` — typed columns, sortable headers, density-aware row padding, loading skeleton, empty state
- [x] `Modal` — centered overlay, sm/md/lg sizes, title, footer slot
- [x] `Drawer` — right-side slide panel, title, footer slot, configurable width
- [x] `NavItem` — icon + label + active state + onPress
- [ ] `Sidebar` — vertical nav, list of NavItems, collapsible, active tracking
- [ ] `Breadcrumb` — path array, last item non-clickable
- [ ] `TabBar` — horizontal tab strip, active indicator
- [x] `PageHeader` — title + optional breadcrumb + optional action button(s)
- [ ] `SearchInput` — Input with search icon pre-wired, clear (×) button
- [ ] `Tooltip` — hover tooltip (web only, no-op on native)
- [ ] `packages/ui/src/components/index.ts` — barrel export all components
- [x] `packages/ui/src/index.ts` — top-level barrel (components + theme + density + tokens)

## App Integration

- [x] Wrap `apps/dashboard` root layout with `ThemeProvider` and `DensityProvider` and `ToastContainer`
- [x] Load Inter font in `apps/dashboard` using `expo-font` or `@expo-google-fonts/inter`

## UI Library Screen

- [x] Create `apps/dashboard/src/app/ui-library.tsx` route (Expo Router)
- [ ] Section: Color swatches (all palette rows with hex labels)
- [ ] Section: Typography (every fontSize × fontWeight sample)
- [ ] Section: Spacing scale (visual ruler boxes)
- [ ] Section: Surfaces & Shadows (cards at each elevation)
- [ ] Section: Border radius samples
- [ ] Section: Buttons — all variants × sizes × loading × disabled
- [ ] Section: Inputs — default, error, disabled
- [ ] Section: TextArea — default, error, disabled
- [x] Section: Switch — on/off, disabled
- [ ] Section: Select, Modal (open/close toggle), Drawer (open/close toggle)
- [x] Section: Badges — all variants + all 7 order statuses
- [ ] Section: Skeleton states
- [x] Section: Toast — triggered by button; WarningBanner static example
- [x] Section: KPI cards, EmptyState, ErrorState
- [ ] Section: Avatar sizes
- [x] Theme toggle button (light/dark) that updates live
- [ ] Density toggle (comfortable/balanced/compact) that updates live

## Verification

- [x] `pnpm --filter=ui typecheck` — zero errors
- [x] `pnpm --filter=ui build` — zero errors
- [ ] `/ui-library` page loads in Expo web without crash
- [ ] Theme toggle changes colors across all sections
- [ ] Density toggle visibly changes table/form spacing
- [ ] Skeleton shimmer animation plays smoothly
- [x] Toast auto-dismisses after 4 seconds
- [x] Order status badges: all 7 show distinct colors
